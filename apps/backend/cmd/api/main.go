package main

import (
	"context"
	"darussunnah-api/internal/features/academics"
	"darussunnah-api/internal/features/agendas"
	"darussunnah-api/internal/features/attendance"
	"darussunnah-api/internal/features/auth"
	"darussunnah-api/internal/features/disciplines"
	"darussunnah-api/internal/features/donations"
	"darussunnah-api/internal/features/exams"
	"darussunnah-api/internal/features/facilities"
	"darussunnah-api/internal/features/faqs"
	"darussunnah-api/internal/features/gallery"
	"darussunnah-api/internal/features/logs"
	"darussunnah-api/internal/features/messages"
	"darussunnah-api/internal/features/news"
	"darussunnah-api/internal/features/notifications"
	"darussunnah-api/internal/features/payments"
	"darussunnah-api/internal/features/programs"
	"darussunnah-api/internal/features/psb"
	"darussunnah-api/internal/features/settings"
	"darussunnah-api/internal/features/teachers"
	"darussunnah-api/internal/features/upload"
	"darussunnah-api/internal/features/videos"
	"darussunnah-api/internal/features/wallet"
	"darussunnah-api/internal/platform/database"
	"darussunnah-api/internal/platform/logger"
	appmiddleware "darussunnah-api/internal/platform/middleware"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
)

func main() {
	fmt.Println("Starting Darussunnah API Monorepo (Go Backend)...")

	// 0. Load Environment variables
	loadEnv()
	validateEnv()
	logger.Init(getEnv("LOG_LEVEL", "info"))

	// 1. Initialize Database
	database.Connect(getEnv("DB_PATH", "./darussunnah.db"))

	// 2. Initialize License System
	err := auth.InitLicense("./public.key")
	if err != nil {
		logger.Warn(context.Background(), "license public key not found or invalid", logger.Field{"error": err.Error()})
	}

	// 3. Setup Router
	r := chi.NewRouter()

	// Basic Middleware
	r.Use(middleware.RequestID)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// CORS Configuration
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   getAllowedOrigins(),
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// 4. Initialize Features
	newsRepo := news.NewRepository(database.DB)
	newsHandler := news.NewHandler(newsRepo)

	psbRepo := psb.NewRepository(database.DB)
	psbHandler := psb.NewHandler(psbRepo)

	teacherRepo := teachers.NewRepository(database.DB)
	teacherHandler := teachers.NewHandler(teacherRepo)

	galleryRepo := gallery.NewRepository(database.DB)
	galleryHandler := gallery.NewHandler(galleryRepo)

	donationRepo := donations.NewRepository(database.DB)
	donationHandler := donations.NewHandler(donationRepo)

	videoRepo := videos.NewRepository(database.DB)
	videoHandler := videos.NewHandler(videoRepo)

	settingRepo := settings.NewRepository(database.DB)
	settingHandler := settings.NewHandler(settingRepo)

	authRepo := auth.NewRepository(database.DB)
	authHandler := auth.NewHandler(authRepo)

	faqRepo := faqs.NewRepository(database.DB)
	faqHandler := faqs.NewHandler(faqRepo)

	facilityRepo := facilities.NewRepository(database.DB)
	facilityHandler := facilities.NewHandler(facilityRepo)

	agendaRepo := agendas.NewRepository(database.DB)
	agendaHandler := agendas.NewHandler(agendaRepo)

	programRepo := programs.NewRepository(database.DB)
	programHandler := programs.NewHandler(programRepo)

	messageRepo := messages.NewRepository(database.DB)
	messageHandler := messages.NewHandler(messageRepo)

	paymentRepo := payments.NewRepository(database.DB)
	paymentHandler := payments.NewHandler(paymentRepo)

	logRepo := logs.NewRepository(database.DB)
	logHandler := logs.NewHandler(logRepo)

	academicRepo := academics.NewRepository(database.DB)
	academicHandler := academics.NewHandler(academicRepo)

	disciplineRepo := disciplines.NewRepository(database.DB)
	disciplineHandler := disciplines.NewHandler(disciplineRepo)

	notificationRepo := notifications.NewRepository(database.DB)
	notificationHandler := notifications.NewHandler(notificationRepo)

	attendanceRepo := attendance.NewRepository(database.DB)
	attendanceHandler := attendance.NewHandler(attendanceRepo)

	examRepo := exams.NewRepository(database.DB)
	examHandler := exams.NewHandler(examRepo)

	walletRepo := wallet.NewRepository(database.DB)
	walletHandler := wallet.NewHandler(walletRepo)

	loginLimiter := appmiddleware.NewRateLimiter(5, 15*time.Minute)
	googleLoginLimiter := appmiddleware.NewRateLimiter(5, 15*time.Minute)
	registerLimiter := appmiddleware.NewRateLimiter(5, 15*time.Minute)
	contactLimiter := appmiddleware.NewRateLimiter(10, time.Hour)

	// 5. Mount Routes
	r.Route("/api", func(r chi.Router) {
		// Public Routes
		r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
			w.Write([]byte("OK"))
		})

		// Public Auth
		r.With(loginLimiter.Middleware).Post("/login", authHandler.Login)
		r.With(registerLimiter.Middleware).Post("/register", authHandler.Register)
		r.With(googleLoginLimiter.Middleware).Post("/auth/google", authHandler.GoogleLogin)
		r.Post("/logout", authHandler.Logout)
		r.Get("/premium-check", authHandler.GetLicenseStatus)
		r.Post("/telegram/webhook", notificationHandler.TelegramWebhook)

		// Public Contact Message
		r.With(contactLimiter.Middleware).Post("/contact", messageHandler.Create)

		// ── Public Access + Protected Writes ──────────────────
		r.Route("/faqs", func(r chi.Router) {
			r.Get("/", faqHandler.List)
			r.Group(func(r chi.Router) {
				r.Use(auth.AuthMiddleware)
				r.Use(auth.RequireLicense(database.DB))
				r.Post("/", faqHandler.Create)
				r.Put("/{id}", faqHandler.Update)
				r.Delete("/{id}", faqHandler.Delete)
				r.Put("/{id}/order", faqHandler.UpdateOrder)
			})
		})
		r.Route("/agendas", func(r chi.Router) {
			r.Get("/", agendaHandler.List)
			r.Group(func(r chi.Router) {
				r.Use(auth.AuthMiddleware)
				r.Use(auth.RequireLicense(database.DB))
				r.Post("/", agendaHandler.Create)
				r.Put("/{id}", agendaHandler.Update)
				r.Delete("/{id}", agendaHandler.Delete)
			})
		})

		// ── Gallery Management ──────────────────
		r.Route("/gallery", func(r chi.Router) {
			r.Get("/", galleryHandler.GetAll) // Public Read

			r.Group(func(r chi.Router) {
				r.Use(auth.AuthMiddleware)
				r.Use(auth.RequireRole("tim_media", "superadmin"))
				r.Post("/", galleryHandler.Create)
				r.Delete("/{id}", galleryHandler.Delete)
			})
		})

		// ── Video Management ──────────────────
		r.Route("/videos", func(r chi.Router) {
			r.Get("/", videoHandler.GetAll) // Public Read

			r.Group(func(r chi.Router) {
				r.Use(auth.AuthMiddleware)
				r.Use(auth.RequireRole("tim_media", "superadmin"))
				r.Post("/", videoHandler.Create)
				r.Put("/{id}", videoHandler.Update)
				r.Delete("/{id}", videoHandler.Delete)
			})
		})

		// ── News Management ──────────────────
		r.Route("/news", func(r chi.Router) {
			r.Get("/", newsHandler.GetAll)               // Public Read
			r.Get("/slug/{slug}", newsHandler.GetBySlug) // Public Read by Slug
			r.Get("/{id}", newsHandler.GetByID)          // Public Read

			r.Group(func(r chi.Router) {
				r.Use(auth.AuthMiddleware)
				r.Use(auth.RequireRole("tim_media", "superadmin"))
				r.Post("/", newsHandler.Create)
				r.Put("/{id}", newsHandler.Update)
				r.Delete("/{id}", newsHandler.Delete)
				r.Put("/{id}/restore", newsHandler.Restore)
				r.Delete("/{id}/force", newsHandler.ForceDelete)
				r.Post("/generate", newsHandler.GenerateArticle) // AI Generation
			})
		})

		// ── Facilities Management ──────────────────
		r.Route("/facilities", func(r chi.Router) {
			r.Get("/", facilityHandler.List) // Public Read

			r.Group(func(r chi.Router) {
				r.Use(auth.AuthMiddleware)
				r.Use(auth.RequireRole("tim_media", "superadmin"))
				r.Post("/", facilityHandler.Create)
				r.Put("/{id}", facilityHandler.Update)
				r.Delete("/{id}", facilityHandler.Delete)
			})
		})

		// ── Teacher Management ──────────────────
		r.Route("/teachers", func(r chi.Router) {
			r.Get("/", teacherHandler.GetAll)      // Public Read
			r.Get("/{id}", teacherHandler.GetByID) // Public Read

			r.Group(func(r chi.Router) {
				r.Use(auth.AuthMiddleware)
				r.Use(auth.RequireRole("tim_media", "superadmin"))
				r.Post("/", teacherHandler.Create)
				r.Put("/{id}", teacherHandler.Update)
				r.Delete("/{id}", teacherHandler.Delete)
			})
		})

		// ── Program Management ──────────────────
		r.Route("/programs", func(r chi.Router) {
			r.Get("/", programHandler.GetAll)      // Public Read
			r.Get("/{id}", programHandler.GetByID) // Public Read

			r.Group(func(r chi.Router) {
				r.Use(auth.AuthMiddleware)
				r.Use(auth.RequireRole("tim_media", "superadmin"))
				r.Post("/", programHandler.Create)
				r.Put("/{id}", programHandler.Update)
				r.Delete("/{id}", programHandler.Delete)
			})
		})

		// ── Other Authenticated Groups ──────────
		r.Get("/settings/public", settingHandler.GetPublic)

		r.Group(func(r chi.Router) {
			r.Use(auth.AuthMiddleware)
			r.Use(auth.RequireLicense(database.DB))

			r.Get("/me", authHandler.GetMe)
			r.Post("/upload", upload.HandleUpload)

			// Superadmin Only
			r.Group(func(r chi.Router) {
				r.Use(auth.RequireRole("superadmin"))
				r.Post("/users", authHandler.CreateUser)
				r.Get("/users", authHandler.GetAllUsers)
				r.Put("/users/{id}/password", authHandler.ResetUserPassword)
				r.Put("/users/{id}/role", authHandler.UpdateUserRole)
				r.Delete("/users/{id}", authHandler.DeleteUser)
				r.Mount("/settings", settingHandler.Routes())
				r.Mount("/logs", logHandler.Routes())

				// CBT Admin
				r.Post("/exams", examHandler.CreateExam)
				r.Post("/exams/questions", examHandler.CreateQuestion)

				// Wallet Admin
				r.Post("/wallet/topup", walletHandler.TopUp)
			})

			// Bendahara Ops
			r.Group(func(r chi.Router) {
				r.Use(auth.RequireRole("bendahara"))
				r.Mount("/payments", paymentHandler.Routes())
				r.Mount("/donations", donationHandler.Routes())
			})

			// Panitia PSB Ops
			r.Group(func(r chi.Router) {
				r.Use(auth.RequireRole("panitia_psb"))
				r.Mount("/psb", psbHandler.Routes())
				r.Mount("/contact", messageHandler.Routes())
			})

			// Portal PSB for calon santri / wali
			r.Group(func(r chi.Router) {
				r.Use(auth.RequireRole("user"))
				r.Get("/psb/me", psbHandler.GetMine)
				r.Put("/psb/me", psbHandler.SaveMine)
				r.Put("/psb/me/documents", psbHandler.SaveMyDocuments)
				r.Put("/psb/me/payment", psbHandler.SaveMyPayment)
				r.Get("/portal/academics/grades", academicHandler.GetMyGrades)
				r.Get("/portal/academics/attendance-summary", academicHandler.GetMyAttendanceSummary)
				r.Get("/portal/academics/tahfidz", academicHandler.GetMyTahfidz)
				r.Get("/attendance/token", attendanceHandler.GetToken)

				// CBT Student
				r.Get("/exams", examHandler.GetAvailableExams)
				r.Get("/exams/{id}/questions", examHandler.GetQuestions)
				r.Post("/exams/session/start", examHandler.StartSession)
				r.Post("/exams/session/answer", examHandler.SubmitAnswer)
				r.Post("/exams/session/finish", examHandler.FinishSession)

				// Wallet Student
				r.Get("/wallet/my", walletHandler.GetMyWallet)
				r.Get("/wallet/history", walletHandler.GetHistory)
				r.Post("/wallet/pin", walletHandler.SetPIN)
				r.Post("/wallet/spend", walletHandler.Spend)
			})

			// Disciplines (Kedisiplinan Santri)
			r.Group(func(r chi.Router) {
				r.Use(auth.RequireRole("superadmin", "panitia_psb"))
				r.Mount("/disciplines", disciplineHandler.Routes())
			})

			// Academic & Notifications
			r.Group(func(r chi.Router) {
				r.Use(auth.RequireRole("superadmin", "bendahara"))
				r.Mount("/academics", academicHandler.Routes())
				r.Mount("/notifications", notificationHandler.Routes())
				r.Post("/attendance/scan", attendanceHandler.Scan)
			})
		})

	})

	// Serve Static Files -> public/uploads
	fileServer := http.FileServer(http.Dir("./public/uploads"))
	r.Handle("/uploads/*", http.StripPrefix("/uploads/", fileServer))

	// 6. Start Server
	port := ":" + getEnv("API_PORT", "8080")
	fmt.Printf("Server running on http://localhost%s\n", port)
	logger.Info(context.Background(), "api server starting", logger.Field{
		"port":            port,
		"allowed_origins": getAllowedOrigins(),
		"log_level":       getEnv("LOG_LEVEL", "info"),
	})
	if err := http.ListenAndServe(port, r); err != nil {
		logger.Error(context.Background(), "api server stopped unexpectedly", logger.Field{"error": err.Error()})
		os.Exit(1)
	}
}

func loadEnv() {
	for _, path := range []string{"../../../.env", "../../.env", ".env"} {
		if err := godotenv.Load(path); err == nil {
			return
		}
	}
	_ = godotenv.Load()
}

func getEnv(key, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}

func getAllowedOrigins() []string {
	raw := getEnv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
	parts := strings.Split(raw, ",")
	origins := make([]string, 0, len(parts))
	for _, part := range parts {
		if trimmed := strings.TrimSpace(part); trimmed != "" {
			origins = append(origins, trimmed)
		}
	}
	return origins
}

func validateEnv() {
	if strings.TrimSpace(os.Getenv("JWT_SECRET")) == "" {
		logger.Error(context.Background(), "missing required environment variable", logger.Field{"variable": "JWT_SECRET"})
		os.Exit(1)
	}

	environment := strings.ToLower(strings.TrimSpace(getEnv("ENVIRONMENT", "development")))
	if environment == "production" {
		if !strings.EqualFold(strings.TrimSpace(os.Getenv("COOKIE_SECURE")), "true") {
			logger.Error(context.Background(), "invalid production security configuration", logger.Field{
				"variable": "COOKIE_SECURE",
				"required": "true in production",
			})
			os.Exit(1)
		}

		if strings.EqualFold(strings.TrimSpace(os.Getenv("DEV_MODE")), "true") {
			logger.Error(context.Background(), "invalid production security configuration", logger.Field{
				"variable": "DEV_MODE",
				"required": "false in production",
			})
			os.Exit(1)
		}

		rawOrigins := strings.TrimSpace(os.Getenv("ALLOWED_ORIGINS"))
		if rawOrigins == "" {
			logger.Error(context.Background(), "missing required environment variable", logger.Field{
				"variable": "ALLOWED_ORIGINS",
				"required": "set explicit production origins",
			})
			os.Exit(1)
		}

		for _, origin := range getAllowedOrigins() {
			o := strings.ToLower(origin)
			if strings.Contains(o, "localhost") || strings.Contains(o, "127.0.0.1") {
				logger.Error(context.Background(), "invalid production cors origin", logger.Field{
					"origin":   origin,
					"required": "no localhost/127.0.0.1 in production",
				})
				os.Exit(1)
			}
		}
	}
}
