package push

// Subscription adalah satu perangkat (browser/HP) yang berlangganan push.
type Subscription struct {
	ID        int64  `json:"id"`
	Endpoint  string `json:"endpoint"`
	P256DH    string `json:"p256dh"`
	Auth      string `json:"auth"`
	UserAgent string `json:"user_agent"`
	CreatedAt string `json:"created_at"`
}

// IRepository ...
type IRepository interface {
	Upsert(s *Subscription) error
	DeleteByEndpoint(endpoint string) (bool, error)
	List() ([]Subscription, error)
}