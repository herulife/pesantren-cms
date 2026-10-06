package news

import (
	"html"
	"net/url"
	"strings"

	xhtml "golang.org/x/net/html"
)

var allowedNewsTags = map[string]bool{
	"p":           true,
	"br":          true,
	"strong":      true,
	"em":          true,
	"b":           true,
	"i":           true,
	"u":           true,
	"ul":          true,
	"ol":          true,
	"li":          true,
	"blockquote":  true,
	"h1":          true,
	"h2":          true,
	"h3":          true,
	"h4":          true,
	"h5":          true,
	"h6":          true,
	"a":           true,
	"img":         true,
	"span":        true,
	"div":         true,
	"table":       true,
	"tbody":       true,
	"tr":          true,
	"td":          true,
	"th":          true,
	"iframe":      true,
}

var blockedNewsTags = map[string]bool{
	"script":   true,
	"style":    true,
	"object":   true,
	"embed":    true,
	"svg":      true,
	"math":     true,
	"form":     true,
	"input":    true,
	"button":   true,
	"textarea": true,
	"select":   true,
	"option":   true,
	"meta":     true,
	"link":     true,
	"base":     true,
	"head":     true,
}

// SanitizeNewsContent exposes the HTML sanitizer for reuse by other features
// (e.g. FAQ answers) so rich-text content is consistently cleaned before storage.
func SanitizeNewsContent(raw string) string {
	return sanitizeNewsHTML(raw)
}

func sanitizeNewsHTML(raw string) string {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return ""
	}

	root, err := xhtml.Parse(strings.NewReader("<div>" + trimmed + "</div>"))
	if err != nil {
		return html.EscapeString(trimmed)
	}

	container := findContainer(root)
	if container == nil {
		return html.EscapeString(trimmed)
	}

	var b strings.Builder
	for child := container.FirstChild; child != nil; child = child.NextSibling {
		writeSanitizedNewsNode(&b, child)
	}

	return strings.TrimSpace(normalizeNewsBreaks(b.String()))
}

func sanitizeNewsModel(n *News) {
	if n == nil {
		return
	}

	n.Content = sanitizeNewsHTML(n.Content)
	n.Excerpt = sanitizeNewsHTML(n.Excerpt)
}

func sanitizeNewsList(items []News) {
	for i := range items {
		sanitizeNewsModel(&items[i])
	}
}

func findContainer(root *xhtml.Node) *xhtml.Node {
	var walk func(*xhtml.Node) *xhtml.Node
	walk = func(node *xhtml.Node) *xhtml.Node {
		if node.Type == xhtml.ElementNode && node.Data == "div" {
			return node
		}
		for child := node.FirstChild; child != nil; child = child.NextSibling {
			if found := walk(child); found != nil {
				return found
			}
		}
		return nil
	}

	return walk(root)
}

func writeSanitizedNewsNode(b *strings.Builder, node *xhtml.Node) {
	switch node.Type {
	case xhtml.TextNode:
		b.WriteString(html.EscapeString(node.Data))
	case xhtml.ElementNode:
		tag := strings.ToLower(node.Data)
		if blockedNewsTags[tag] {
			return
		}

		if tag == "br" {
			b.WriteString("<br>")
			return
		}

		if !allowedNewsTags[tag] {
			for child := node.FirstChild; child != nil; child = child.NextSibling {
				writeSanitizedNewsNode(b, child)
			}
			return
		}

		b.WriteByte('<')
		b.WriteString(tag)
		if tag == "a" {
			if href, ok := sanitizedHref(node.Attr); ok {
				b.WriteString(` href="`)
				b.WriteString(html.EscapeString(href))
				b.WriteString(`" rel="noopener noreferrer"`)
			}
		} else if tag == "img" {
			var src, alt, style string
			for _, attr := range node.Attr {
				if strings.EqualFold(attr.Key, "src") {
					src = attr.Val
				} else if strings.EqualFold(attr.Key, "alt") {
					alt = attr.Val
				} else if strings.EqualFold(attr.Key, "style") {
					style = attr.Val
				}
			}
			if src != "" {
				if s := sanitizedImageSrc(src); s != "" {
					b.WriteString(` src="`)
					b.WriteString(html.EscapeString(s))
					b.WriteString(`"`)
				}
			}
			if alt != "" {
				b.WriteString(` alt="`)
				b.WriteString(html.EscapeString(alt))
				b.WriteString(`"`)
			}
			if style != "" {
				b.WriteString(` style="`)
				b.WriteString(html.EscapeString(sanitizeStyle(style)))
				b.WriteString(`"`)
			}
			// img is self closing
			b.WriteString(` />`)
			return
		} else if tag == "iframe" {
			var src, style, allow, frameborder string
			var allowfullscreen bool
			for _, attr := range node.Attr {
				if strings.EqualFold(attr.Key, "src") {
					if s := sanitizedIframeSrc(attr.Val); s != "" {
						src = s
					}
				} else if strings.EqualFold(attr.Key, "style") {
					style = attr.Val
				} else if strings.EqualFold(attr.Key, "allow") {
					allow = attr.Val
				} else if strings.EqualFold(attr.Key, "frameborder") {
					frameborder = attr.Val
				} else if strings.EqualFold(attr.Key, "allowfullscreen") {
					allowfullscreen = true
				}
			}
			if src != "" {
				b.WriteString(` src="`)
				b.WriteString(html.EscapeString(src))
				b.WriteString(`"`)
			}
			if style != "" {
				b.WriteString(` style="`)
				b.WriteString(html.EscapeString(sanitizeStyle(style)))
				b.WriteString(`"`)
			}
			if allow != "" {
				b.WriteString(` allow="`)
				b.WriteString(html.EscapeString(allow))
				b.WriteString(`"`)
			}
			if frameborder != "" {
				b.WriteString(` frameborder="`)
				b.WriteString(html.EscapeString(frameborder))
				b.WriteString(`"`)
			}
			if allowfullscreen {
				b.WriteString(` allowfullscreen`)
			}
			b.WriteByte('>')
			for child := node.FirstChild; child != nil; child = child.NextSibling {
				writeSanitizedNewsNode(b, child)
			}
			b.WriteString("</iframe>")
			return
		} else {
			// Extract style for other allowed tags
			var style, classStr string
			for _, attr := range node.Attr {
				if strings.EqualFold(attr.Key, "style") {
					style = attr.Val
				} else if strings.EqualFold(attr.Key, "class") {
					classStr = attr.Val
				}
			}
			if style != "" {
				b.WriteString(` style="`)
				b.WriteString(html.EscapeString(sanitizeStyle(style)))
				b.WriteString(`"`)
			}
			if classStr != "" {
				b.WriteString(` class="`)
				b.WriteString(html.EscapeString(classStr))
				b.WriteString(`"`)
			}
		}
		b.WriteByte('>')

		for child := node.FirstChild; child != nil; child = child.NextSibling {
			writeSanitizedNewsNode(b, child)
		}

		b.WriteString("</")
		b.WriteString(tag)
		b.WriteByte('>')
	}
}

func sanitizedHref(attrs []xhtml.Attribute) (string, bool) {
	for _, attr := range attrs {
		if !strings.EqualFold(attr.Key, "href") {
			continue
		}

		value := strings.TrimSpace(attr.Val)
		if value == "" {
			return "", false
		}

		parsed, err := url.Parse(value)
		if err != nil {
			return "", false
		}

		// Reject protocol-relative (//evil.com) and non-allowlisted schemes.
		if parsed.Scheme == "http" || parsed.Scheme == "https" || parsed.Scheme == "mailto" {
			return value, true
		}

		return "", false
	}

	return "", false
}

// sanitizedImageSrc validates an <img src>. Only http(s), protocol-relative-free
// absolute paths and site-relative uploads are accepted. data: and javascript:
// URLs are rejected: a data: image can smuggle an SVG payload carrying script,
// and allowing arbitrary schemes on a src attribute is the classic way to turn a
// sanitized <img> into an injection point.
func sanitizedImageSrc(raw string) string {
	value := strings.TrimSpace(raw)
	if value == "" {
		return ""
	}

	lower := strings.ToLower(value)

	// Reject control characters used to smuggle "java\tscript:" past a naive
	// prefix check.
	if strings.ContainsAny(lower, "\x00\n\r\t\v\f") {
		return ""
	}

	if strings.HasPrefix(lower, "data:") || strings.HasPrefix(lower, "blob:") || strings.HasPrefix(lower, "javascript:") {
		return ""
	}

	if strings.HasPrefix(value, "/") {
		// Site-relative path (including protocol-relative // which is rejected
		// below because it also starts with "/").
		if strings.HasPrefix(value, "//") {
			return ""
		}
		return value
	}

	parsed, err := url.Parse(value)
	if err != nil {
		return ""
	}
	if parsed.Scheme == "http" || parsed.Scheme == "https" {
		return value
	}
	return ""
}

// sanitizeStyle strips dangerous CSS constructs (expression(), url(),
// javascript:, @import) that could enable CSS-based injection.
func sanitizeStyle(raw string) string {
	cleaned := strings.ReplaceAll(strings.ToLower(raw), " ", "")
	cleaned = strings.ReplaceAll(cleaned, "\t", "")
	cleaned = strings.ReplaceAll(cleaned, "\n", "")
	if strings.Contains(cleaned, "expression(") ||
		strings.Contains(cleaned, "url(") ||
		strings.Contains(cleaned, "javascript:") ||
		strings.Contains(cleaned, "@import") ||
		strings.Contains(cleaned, "behavior:") {
		return ""
	}
	return raw
}

func sanitizedIframeSrc(raw string) string {
	value := strings.TrimSpace(raw)
	if value == "" {
		return ""
	}

	parsed, err := url.Parse(value)
	if err != nil {
		return ""
	}

	if parsed.Scheme != "https" {
		return ""
	}

	allowedHosts := map[string]bool{
		"www.youtube.com":       true,
		"youtube.com":           true,
		"www.youtube-nocookie.com": true,
		"drive.google.com":      true,
		"player.vimeo.com":      true,
	}

	host := strings.ToLower(parsed.Host)
	if !allowedHosts[host] {
		return ""
	}

	return value
}

func normalizeNewsBreaks(raw string) string {
	replacer := strings.NewReplacer(
		"</p><p>", "</p>\n<p>",
		"</li><li>", "</li>\n<li>",
		"<br><br>", "<br>\n<br>",
	)
	return replacer.Replace(raw)
}
