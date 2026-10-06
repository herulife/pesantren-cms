package upload

import (
	"bytes"
	"image"
	"image/color"
	"image/gif"
	"image/png"
	"testing"
)

// TestSanitizeImageRejectsDecompressionBomb is a regression test for a
// decompression-bomb vulnerability.
//
// The bug was ordering: image.Decode was called first and only afterwards were
// the dimensions inspected. image.Decode allocates width*height*4 bytes before
// returning, so by the time the pixel-count check ran the container had already
// tried to allocate the full decoded buffer. A few-KB PNG declaring a huge
// canvas could therefore take the API down.
//
// Now DecodeConfig runs first, so an oversized image is rejected from its header
// alone and the pixels are never allocated.
func TestSanitizeImageRejectsDecompressionBomb(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping bomb test in short mode")
	}

	// Build a small PNG file that declares enormous dimensions. We hand-craft
	// the IHDR so the on-disk file stays tiny while claiming a huge canvas.
	bomb := craftPNGWithDeclaredSize(t, 40000, 40000)

	_, _, err := sanitizeImage(bytes.NewReader(bomb))
	if err == nil {
		t.Fatal("expected a decompression bomb to be rejected, got nil error")
	}

	// The error must be the dimension/pixel guard, not an incidental decode
	// failure, so we know the header check is what did the work.
	msg := err.Error()
	if !bytes.Contains([]byte(msg), []byte("dimensions too large")) &&
		!bytes.Contains([]byte(msg), []byte("pixel count too large")) {
		t.Fatalf("expected a dimension/pixel rejection, got: %v", err)
	}
}

// TestSanitizeImageRejectsOversizedPixelCount covers the pixel-count guard even
// when neither side exceeds the per-axis dimension limit.
func TestSanitizeImageRejectsOversizedPixelCount(t *testing.T) {
	// 19999x19999 is under maxImageDimension (20000) but ~400M pixels, well over
	// maxImagePixels (40M).
	bomb := craftPNGWithDeclaredSize(t, 19999, 19999)

	_, _, err := sanitizeImage(bytes.NewReader(bomb))
	if err == nil {
		t.Fatal("expected oversized pixel count to be rejected")
	}
	if !bytes.Contains([]byte(err.Error()), []byte("pixel count too large")) {
		t.Fatalf("expected pixel count rejection, got: %v", err)
	}
}

// TestSanitizeImageAcceptsNormalImage confirms the hardening did not reject
// legitimate staff uploads.
func TestSanitizeImageAcceptsNormalImage(t *testing.T) {
	src := image.NewRGBA(image.Rect(0, 0, 120, 80))
	for x := 0; x < 120; x++ {
		for y := 0; y < 80; y++ {
			src.Set(x, y, color.RGBA{R: uint8(x), G: uint8(y), B: 100, A: 255})
		}
	}

	var buf bytes.Buffer
	if err := png.Encode(&buf, src); err != nil {
		t.Fatalf("encode fixture: %v", err)
	}

	out, format, err := sanitizeImage(bytes.NewReader(buf.Bytes()))
	if err != nil {
		t.Fatalf("normal image rejected: %v", err)
	}
	if format != "png" {
		t.Fatalf("format = %q want png", format)
	}
	if len(out) == 0 {
		t.Fatal("expected non-empty output")
	}
}

// craftPNGWithDeclaredSize writes a valid PNG signature plus an IHDR advertising
// the requested width/height. It intentionally stops before IDAT: the point is
// that the header check must reject it before any pixel allocation happens.
func craftPNGWithDeclaredSize(t *testing.T, width, height uint32) []byte {
	t.Helper()

	var buf bytes.Buffer
	buf.Write([]byte{0x89, 'P', 'N', 'G', '\r', '\n', 0x1a, '\n'})

	// IHDR is always the first chunk: length(4) type(4) data(13) crc(4).
	ihdr := make([]byte, 0, 13)
	ihdr = appendU32(ihdr, width)
	ihdr = appendU32(ihdr, height)
	ihdr = append(ihdr, 8)  // bit depth
	ihdr = append(ihdr, 2)  // colour type: truecolour RGB
	ihdr = append(ihdr, 0)  // compression
	ihdr = append(ihdr, 0)  // filter
	ihdr = append(ihdr, 0)  // interlace

	var chunk bytes.Buffer
	chunk.Write([]byte("IHDR"))
	chunk.Write(ihdr)
	crc := crc32IEEE(chunk.Bytes())
	chunk.Write(appendU32(nil, crc))

	buf.Write(appendU32(nil, uint32(len(ihdr))))
	buf.Write(chunk.Bytes())

	// No IDAT: enough for DecodeConfig, and the guard must fire before anyone
	// tries to read actual pixel data.
	return buf.Bytes()
}

func appendU32(dst []byte, v uint32) []byte {
	return append(dst, byte(v>>24), byte(v>>16), byte(v>>8), byte(v))
}

// crc32IEEE is a small local helper so the test does not pull in hash/crc32 for
// a single fixture value.
func crc32IEEE(data []byte) uint32 {
	var table [256]uint32
	for i := range table {
		c := uint32(i)
		for k := 0; k < 8; k++ {
			if c&1 != 0 {
				c = 0xEDB88320 ^ (c >> 1)
			} else {
				c >>= 1
			}
		}
		table[i] = c
	}

	crc := uint32(0xFFFFFFFF)
	for _, b := range data {
		crc = table[(crc^uint32(b))&0xFF] ^ (crc >> 8)
	}
	return ^crc
}

// TestSanitizeImageRejectsAnimatedGIFBomb covers the GIF variant of the bomb.
//
// An animated GIF can declare a modest per-frame canvas while hiding many
// frames, so the real decoded buffer is much larger than width*height implies.
// The header guard only sees the first frame's canvas, so this asserts the
// additional frame-count ceiling actually rejects the file.
func TestSanitizeImageRejectsAnimatedGIFBomb(t *testing.T) {
	var buf bytes.Buffer
	frame := image.NewPaletted(image.Rect(0, 0, 600, 600), color.Palette{color.Black, color.White})

	frames := make([]*image.Paletted, 0, maxImageFrames+1)
	delays := make([]int, 0, maxImageFrames+1)
	for i := 0; i <= maxImageFrames; i++ {
		frames = append(frames, frame)
		delays = append(delays, 10)
	}

	if err := gif.EncodeAll(&buf, &gif.GIF{Image: frames, Delay: delays}); err != nil {
		t.Fatalf("encode fixture: %v", err)
	}

	_, _, err := sanitizeImage(bytes.NewReader(buf.Bytes()))
	if err == nil {
		t.Fatal("expected an over-long animated GIF to be rejected")
	}
	if !bytes.Contains([]byte(err.Error()), []byte("frames")) {
		t.Fatalf("expected a frame-count rejection, got: %v", err)
	}
}
// TestCountGIFFrames pins the walker against the standard library decoder.
//
// The frame-count guard is only useful if it sees every frame. An earlier version
// forgot to skip the Local Color Table in the image descriptor, which
// desynchronised the walk and reported 1 frame for a 60-frame GIF, silently
// disabling the guard. Comparing against gif.DecodeAll keeps that honest.
func TestCountGIFFrames(t *testing.T) {
	frame := image.NewPaletted(image.Rect(0, 0, 60, 60), color.Palette{color.Black, color.White})

	cases := []struct {
		name   string
		frames int
	}{
		{"single frame", 1},
		{"two frames", 2},
		{"sixty frames", 60},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			imgs := make([]*image.Paletted, 0, tc.frames)
			delays := make([]int, 0, tc.frames)
			for i := 0; i < tc.frames; i++ {
				imgs = append(imgs, frame)
				delays = append(delays, 10)
			}

			var buf bytes.Buffer
			if err := gif.EncodeAll(&buf, &gif.GIF{Image: imgs, Delay: delays}); err != nil {
				t.Fatalf("encode fixture: %v", err)
			}

			want, err := gif.DecodeAll(bytes.NewReader(buf.Bytes()))
			if err != nil {
				t.Fatalf("stdlib decode: %v", err)
			}

			got, err := countGIFFrames(buf.Bytes())
			if err != nil {
				t.Fatalf("countGIFFrames: %v", err)
			}
			if got != len(want.Image) {
				t.Fatalf("countGIFFrames = %d, gif.DecodeAll sees %d", got, len(want.Image))
			}
		})
	}
}

// TestCountGIFFramesRejectsGarbage makes sure malformed input cannot be used to
// bypass the frame check by making the walker bail out early.
func TestCountGIFFramesRejectsGarbage(t *testing.T) {
	for _, raw := range [][]byte{
		[]byte("not a gif"),
		[]byte("GIF89a"),
		append([]byte("GIF89a"), make([]byte, 4)...),
	} {
		if _, err := countGIFFrames(raw); err == nil {
			t.Fatalf("expected error for %q", raw[:min(8, len(raw))])
		}
	}
}
