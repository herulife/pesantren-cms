package news

import "testing"

// TestSanitizeNewsHTMLBlocksXSS locks in the server-side allowlist that limits the
// blast radius of the SunEditor sanitizer-bypass advisory (GHSA on suneditor,
// "no fix available").
//
// The admin news editor writes HTML straight to news.content, and the public
// article page renders it with dangerouslySetInnerHTML. If SunEditor's own
// sanitizer can be bypassed, this function is the only thing standing between a
// compromised admin account and stored XSS against every site visitor.
func TestSanitizeNewsHTMLBlocksXSS(t *testing.T) {
	cases := []struct {
		name  string
		in    string
		bans  []string
		keeps []string
	}{
		{
			name: "script tag removed",
			in:   `<p>halo</p><script>alert(1)</script>`,
			bans: []string{"<script", "alert(1)"},
		},
		{
			name: "img onerror stripped",
			in:   `<img src="x" onerror="alert(1)">`,
			bans: []string{"onerror", "alert(1)"},
		},
		{
			name: "javascript href dropped",
			in:   `<a href="javascript:alert(1)">klik</a>`,
			bans: []string{"javascript:"},
		},
		{
			name: "protocol relative href dropped",
			in:   `<a href="//evil.example/x">klik</a>`,
			bans: []string{"//evil.example"},
		},
		{
			name: "style expression stripped",
			in:   `<p style="width:expression(alert(1))">x</p>`,
			bans: []string{"expression("},
		},
		{
			name: "style url stripped",
			in:   `<p style="background:url(javascript:alert(1))">x</p>`,
			bans: []string{"url("},
		},
		{
			name: "svg onload stripped",
			in:   `<svg onload="alert(1)"></svg>`,
			bans: []string{"<svg", "onload"},
		},
		{
			name: "iframe with foreign host stripped",
			in:   `<iframe src="https://evil.example/x"></iframe>`,
			bans: []string{"evil.example"},
		},
		{
			name: "iframe with javascript src stripped",
			in:   `<iframe src="javascript:alert(1)"></iframe>`,
			bans: []string{"javascript:"},
		},
		{
			name: "form and inputs stripped",
			in:   `<form action="/x"><input name="a"><button>go</button></form>`,
			bans: []string{"<form", "<input", "<button"},
		},
		{
			name: "data uri img stripped",
			in:   `<img src="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">`,
			bans: []string{"data:text/html"},
		},
		{
			name: "svg data uri img stripped",
			in:   `<img src="data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoMSk+">`,
			bans: []string{"data:image/svg"},
		},
		{
			name: "obfuscated scheme with control chars dropped",
			in:   "<a href=\"java\tscript:alert(1)\">x</a>",
			bans: []string{"script:", "alert(1)"},
		},
		{
			name: "object and embed stripped",
			in:   `<object data="x.swf"></object><embed src="y">`,
			bans: []string{"<object", "<embed"},
		},
		{
			name: "meta refresh stripped",
			in:   `<meta http-equiv="refresh" content="0;url=//evil.example">`,
			bans: []string{"<meta", "evil.example"},
		},
		{
			name: "event handler on allowed tag stripped",
			in:   `<div onclick="alert(1)" onmouseover="alert(2)">x</div>`,
			bans: []string{"onclick", "onmouseover", "alert("},
		},
		{
			name: "unknown tag unwrapped but children kept",
			in:   `<custom-element><p>aman</p></custom-element>`,
			bans: []string{"<custom-element"},
			keeps: []string{"aman"},
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := SanitizeNewsContent(tc.in)
			for _, ban := range tc.bans {
				if containsFold(got, ban) {
					t.Fatalf("output still contains %q\ninput:  %s\noutput: %s", ban, tc.in, got)
				}
			}
			for _, keep := range tc.keeps {
				if !containsFold(got, keep) {
					t.Fatalf("output lost expected content %q\ninput:  %s\noutput: %s", keep, tc.in, got)
				}
			}
		})
	}
}

// TestSanitizeNewsHTMLKeepsLegitimateContent guards against the sanitizer
// becoming so aggressive that normal articles break.
func TestSanitizeNewsHTMLKeepsLegitimateContent(t *testing.T) {
	in := `<h2>Judul</h2><p>Paragraf <strong>tebal</strong> dan <em>miring</em>.</p>` +
		`<ul><li>butir satu</li><li>butir dua</li></ul>` +
		`<p><a href="https://darussunnahparung.com/profil">Profil</a></p>` +
		`<img src="/uploads/abc123.jpg" alt="gedung">`

	got := SanitizeNewsContent(in)

	for _, want := range []string{
		"<h2>Judul</h2>",
		"<strong>tebal</strong>",
		"<em>miring</em>",
		"<ul>",
		"<li>butir satu</li>",
		`href="https://darussunnahparung.com/profil"`,
		`src="/uploads/abc123.jpg"`,
		`alt="gedung"`,
	} {
		if !containsFold(got, want) {
			t.Fatalf("legitimate content %q was stripped\ninput:  %s\noutput: %s", want, in, got)
		}
	}
}

// TestSanitizeNewsHTMLAnchorsGetNoopener covers the tab-nabbing vector.
func TestSanitizeNewsHTMLAnchorsGetNoopener(t *testing.T) {
	got := SanitizeNewsContent(`<a href="https://example.com">x</a>`)
	if !containsFold(got, "rel=\"noopener noreferrer\"") {
		t.Fatalf("anchor missing rel=noopener noreferrer: %s", got)
	}
}

// TestSanitizeNewsHTMLAllowsKnownIframeHosts keeps YouTube embeds working, since
// the campus site embeds videos.
func TestSanitizeNewsHTMLAllowsKnownIframeHosts(t *testing.T) {
	for _, src := range []string{
		"https://www.youtube.com/embed/abc",
		"https://www.youtube-nocookie.com/embed/abc",
		"https://drive.google.com/uc?id=abc",
	} {
		got := SanitizeNewsContent(`<iframe src="` + src + `"></iframe>`)
		if !containsFold(got, "src=") {
			t.Fatalf("legitimate iframe %s was stripped: %s", src, got)
		}
	}
}

func containsFold(haystack, needle string) bool {
	if needle == "" {
		return true
	}
	return len(haystack) >= len(needle) && indexFold(haystack, needle) >= 0
}

func indexFold(haystack, needle string) int {
	hl := len(haystack)
	nl := len(needle)
	for i := 0; i+nl <= hl; i++ {
		match := true
		for j := 0; j < nl; j++ {
			a, b := haystack[i+j], needle[j]
			if 'A' <= a && a <= 'Z' {
				a += 'a' - 'A'
			}
			if 'A' <= b && b <= 'Z' {
				b += 'a' - 'A'
			}
			if a != b {
				match = false
				break
			}
		}
		if match {
			return i
		}
	}
	return -1
}