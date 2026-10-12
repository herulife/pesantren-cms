package teachers

// PHASE 4: DTO publik — email & WhatsApp staf TIDAK keluar API publik.

type TeacherPublicDTO struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	Subject  string `json:"subject"`
	Bio      string `json:"bio"`
	ImageURL string `json:"image_url"`
}

func toPublic(t Teacher) TeacherPublicDTO {
	return TeacherPublicDTO{
		ID:       t.ID,
		Name:     t.Name,
		Subject:  t.Subject,
		Bio:      t.Bio,
		ImageURL: t.ImageURL,
	}
}

func toPublicList(list []Teacher) []TeacherPublicDTO {
	out := make([]TeacherPublicDTO, 0, len(list))
	for _, t := range list {
		out = append(out, toPublic(t))
	}
	return out
}
