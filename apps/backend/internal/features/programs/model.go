package programs

type Program struct {
	ID         int    `json:"id"`
	Title      string `json:"title"`
	Slug       string `json:"slug"`
	Category   string `json:"category"`
	Excerpt    string `json:"excerpt"`
	Content    string `json:"content"`
	ImageURL   string `json:"image_url"`
	IsFeatured bool   `json:"is_featured"`
	OrderIndex int    `json:"order_index"`
	CreatedAt  string `json:"created_at"`
	UpdatedAt  string `json:"updated_at"`
}
