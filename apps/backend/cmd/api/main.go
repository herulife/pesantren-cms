package main

import (
	"almaparung-api/internal/features/academics"
	"almaparung-api/internal/features/agendas"
	"almaparung-api/internal/features/attendance"
	"almaparung-api/internal/features/auth"
	"almaparung-api/internal/features/autobilling"
	"almaparung-api/internal/features/bgn"
	"almaparung-api/internal/features/disciplines"
	"almaparung-api/internal/features/donations"
	"almaparung-api/internal/features/exams"
	"almaparung-api/internal/features/facilities"
	"almaparung-api/internal/features/faqs"
	"almaparung-api/internal/features/gallery"
	"almaparung-api/internal/features/hr"
	"almaparung-api/internal/features/invoices"
	"almaparung-api/internal/features/iuran"
	"almaparung-api/internal/features/kas"
	"almaparung-api/internal/features/logs"
	"almaparung-api/internal/features/messages"
	"almaparung-api/internal/features/news"
	"almaparung-api/internal/features/notes"
	"almaparung-api/internal/features/notifications"
	"almaparung-api/internal/features/otp"
	"almaparung-api/internal/features/payments"
	"almaparung-api/internal/features/programs"
	"almaparung-api/internal/features/project"
	"almaparung-api/internal/features/psb"
	"almaparung-api/internal/features/raport"
	"almaparung-api/internal/features/santri"
	"almaparung-api/internal/features/school"
	"almaparung-api/internal/features/settings"
	"almaparung-api/internal/features/spp"
	"almaparung-api/internal/features/teachers"
	"almaparung-api/internal/features/upload"
	"almaparung-api/internal/features/videos"
	"almaparung-api/internal/features/wallet"
	"almaparung-api/internal/platform/audit"
	"almaparung-api/internal/platform/database"
	"almaparung-api/internal/platform/logger"
	appmiddleware "almaparung-api/internal/platform/middleware"
	"almaparung-api/internal/platform/wagate"
	"almaparung-api/internal/platform/wanotif"
	"almaparung-api/internal/platform/weight"
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
)

func main() {
	fmt.Println("Starting Al-Maa API Monorepo (Go Backend)...")

	// 0. Load Environment variables
	loadEnv()
	validateEnv()
	logger.Init(getEnv("LOG_LEVEL", "info"))

	// 1. Initialize Database
	database.Connect(getEnv("DB_PATH", "./alma.db"))
	// PHASE 2: validasi sesi revocable (user exists + role + token_version).
	auth.ConfigureSessionValidation(database.DB)
	audit.Configure(database.DB)

	// 1b. WhatsApp gateway mandiri (auto-connect bila sesi tersimpan ada)
	go wagate.GetManager().Start(context.Background())

	// 1c. Pengirim-ulang otomatis notifikasi WA (outbox wa_notifications).
	wanotif.StartRetrier()

	// 2. Setup Router
	r := chi.NewRouter()

	// Basic Middleware
	r.Use(middleware.RequestID)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	// AUDIT FIX [6.7]: baseline security headers.
	r.Use(appmiddleware.SecurityHeaders)

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
	santriRepo := santri.NewRepository(database.DB)
	santriHandler := santri.NewHandler(santriRepo)
	projectRepo := project.NewRepository(database.DB)
	projectHandler := project.NewHandler(projectRepo)
	raportRepo := raport.NewRepository(database.DB)
	raportHandler := raport.NewHandler(raportRepo)
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
	// AI Config dari tabel settings disuntikkan ke env runtime agar generator
	// artikel & draf pesan memakai provider yang dikonfigurasi admin.
	loadAISettingsFromDB(settingRepo)
	loadKKMFromDB(settingRepo)
	// PSB memakai pengaturan publik (biaya & rekening) untuk notifikasi WA.
	psbHandler = psbHandler.WithSettingsStore(settingRepo)

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

	sppRepo := spp.NewRepository(database.DB)
	sppHandler := spp.NewHandler(sppRepo).WithConfigStore(settingRepo)
	autobilling.New(settingRepo, sppRepo, 6*time.Hour).Start(context.Background())

	iuranRepo := iuran.NewRepository(database.DB)
	iuranHandler := iuran.NewHandler(iuranRepo)

	schoolRepo := school.NewRepository(database.DB)
	schoolHandler := school.NewHandler(schoolRepo)

	kasRepo := kas.NewRepository(database.DB)
	kasHandler := kas.NewHandler(kasRepo)

	hrRepo := hr.NewRepository(database.DB)
	hrHandler := hr.NewHandler(hrRepo)

	logRepo := logs.NewRepository(database.DB)
	logHandler := logs.NewHandler(logRepo)

	academicRepo := academics.NewRepository(database.DB)
	academicHandler := academics.NewHandler(academicRepo)

	disciplineRepo := disciplines.NewRepository(database.DB)
	disciplineHandler := disciplines.NewHandler(disciplineRepo)

	bgnRepo := bgn.NewRepository(database.DB)
	bgnHandler := bgn.NewHandler(bgnRepo)

	notificationRepo := notifications.NewRepository(database.DB)
	notificationHandler := notifications.NewHandler(notificationRepo)

	attendanceRepo := attendance.NewRepository(database.DB)
	attendanceHandler := attendance.NewHandler(attendanceRepo)

	examRepo := exams.NewRepository(database.DB)
	examHandler := exams.NewHandler(examRepo)

	walletRepo := wallet.NewRepository(database.DB)
	walletHandler := wallet.NewHandler(walletRepo)

	otpRepo := otp.NewRepository(database.DB)
	otpHandler := otp.NewHandler(otpRepo)

	invoiceRepo := invoices.NewRepository(database.DB)
	invoiceHandler := invoices.NewHandler(invoiceRepo)

	noteRepo := notes.NewRepository(database.DB)
	noteHandler := notes.NewHandler(noteRepo)

	loginLimiter := appmiddleware.NewRateLimiter(30, 5*time.Minute)
	googleLoginLimiter := appmiddleware.NewRateLimiter(30, 5*time.Minute)
	registerLimiter := appmiddleware.NewRateLimiter(30, 5*time.Minute)
	contactLimiter := appmiddleware.NewRateLimiter(20, time.Hour)
	// AUDIT FIX [6.8]: spam/DoS protection. Upload stays open to role "user"
	// (portal butuh upload bukti), dibatasi 30/jam. Webhook Telegram 120/menit.
	uploadLimiter := appmiddleware.NewRateLimiter(30, time.Hour)
	webhookLimiter := appmiddleware.NewRateLimiter(120, time.Minute)
	newsGenLimiter := appmiddleware.NewRateLimiter(10, time.Hour)
	noteLimiter := appmiddleware.NewRateLimiter(60, time.Hour)
	otpRequestLimiter := appmiddleware.NewRateLimiter(10, time.Hour)
	otpVerifyLimiter := appmiddleware.NewRateLimiter(30, time.Hour)

	// 5. Mount Routes
	r.Route("/api", func(r chi.Router) {
		// Public Routes
		r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
			w.Write([]byte("OK"))
		})

		// Readiness: liveness OK belum berarti DB bisa diakses.
		r.Get("/ready", func(w http.ResponseWriter, r *http.Request) {
			var one int
			if err := database.DB.QueryRow("SELECT 1").Scan(&one); err != nil {
				w.WriteHeader(http.StatusServiceUnavailable)
				w.Write([]byte("NOT READY"))
				return
			}
			w.Write([]byte("READY"))
		})

		// Public Auth
		r.With(loginLimiter.Middleware).Post("/login", authHandler.Login)
		r.With(registerLimiter.Middleware).Post("/register", authHandler.Register)
		r.With(googleLoginLimiter.Middleware).Post("/auth/google", authHandler.GoogleLogin)
		r.Post("/logout", authHandler.Logout)
		r.With(webhookLimiter.Middleware).Post("/telegram/webhook", notificationHandler.TelegramWebhook)
		r.With(otpRequestLimiter.Middleware).Post("/otp/request", otpHandler.Request)
		r.With(otpVerifyLimiter.Middleware).Post("/otp/verify", otpHandler.Verify)
		r.With(webhookLimiter.Middleware).Post("/invoices/webhook", invoiceHandler.Webhook)

		// Public Contact Message
		r.With(contactLimiter.Middleware).Post("/contact", messageHandler.Create)

		// Public Notes (pastebin tanpa login). GET publik; CREATE rate-limited per IP.
		r.Route("/notes", func(r chi.Router) {
			r.With(noteLimiter.Middleware).Post("/", noteHandler.Create)
			r.Get("/mine", noteHandler.ListMine)
			r.Get("/{urlID}", noteHandler.Get)
			r.Delete("/{urlID}", noteHandler.Delete)
		})

		// Public PSB Pengumuman: cek kelulusan dengan nomor pendaftaran (tanpa login).
		r.Get("/psb/pengumuman", psbHandler.GetPengumuman)

		// ── Public Access + Protected Writes ──────────────────
		r.Route("/faqs", func(r chi.Router) {
			r.Get("/", faqHandler.List)
			r.Group(func(r chi.Router) {
				r.Use(auth.AuthMiddleware)
				r.Use(auth.RequireRole("superadmin", "tim_media"))
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
				r.Use(auth.RequireRole("superadmin", "tim_media"))
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
				r.Put("/{id}/pin", newsHandler.SetPinned)
				r.Delete("/{id}/force", newsHandler.ForceDelete)
				r.With(newsGenLimiter.Middleware).Post("/generate", newsHandler.GenerateArticle) // AI Generation
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

		// ── Public Donasi ──────────
		r.Get("/donations/campaigns", donationHandler.GetCampaigns)
		r.Get("/donations", donationHandler.GetDonations)
		r.Get("/donations/stats", donationHandler.GetStats)

		// ── Other Authenticated Groups ──────────
		r.Get("/settings/public", settingHandler.GetPublic)

		r.Group(func(r chi.Router) {
			r.Use(auth.AuthMiddleware)

			r.Get("/me", authHandler.GetMe)
			r.Get("/settings/role-permissions", settingHandler.GetRolePermissions)
			r.With(uploadLimiter.Middleware).Post("/upload", upload.HandleUpload)

			// Manajemen user: superadmin/bendahara boleh kelola (lihat,
			// tambah, ubah role, reset password). Hapus user tetap hanya superadmin.
			r.Group(func(r chi.Router) {
				r.Use(auth.RequireRole("superadmin", "bendahara"))
				r.Get("/users", authHandler.GetAllUsers)
				r.Post("/users", authHandler.CreateUser)
				r.Put("/users/{id}/password", authHandler.ResetUserPassword)
				r.Put("/users/{id}/role", authHandler.UpdateUserRole)
			})

			// Superadmin Only
			r.Group(func(r chi.Router) {
				r.Use(auth.RequireRole("superadmin"))
				r.Delete("/users/{id}", authHandler.DeleteUser)
				r.Mount("/settings", settingHandler.Routes())
				r.Mount("/logs", logHandler.Routes())


				// Wallet Admin
				r.Post("/wallet/topup", walletHandler.TopUp)
			})

			// CBT Admin: superadmin + guru (mapel sendiri dicek di handler)
			r.Group(func(r chi.Router) {
				r.Use(auth.RequireRole("superadmin", "guru"))
				r.Post("/exams", examHandler.CreateExam)
				r.Post("/exams/questions", examHandler.CreateQuestion)
			})

			// Bendahara Ops
			r.Group(func(r chi.Router) {
				r.Use(auth.RequireRole("bendahara"))
				r.Mount("/payments", paymentHandler.Routes())
				r.Mount("/spp", sppHandler.Routes())
				r.Mount("/iuran", iuranHandler.Routes())
				r.Mount("/donations", donationHandler.Routes())
				r.Mount("/kas", kasHandler.Routes())
			})

			// Master Sekolah (kelas + tahun ajaran).
			// READ (kelas + tahun ajaran) dibuka ke semua role operasional: form
			// Kesantrian & halaman raport milik wali_kelas/pimpinan memanggil
			// GET /school/classes. Sebelumnya grup ini hanya superadmin/bendahara/
			// panitia_psb/admin -> 403 -> dropdown "Kelas" kosong dan wali kelas
			// tidak bisa memilih kelas sama sekali.
			// WRITE (create/update/delete/activate) tetap superadmin/bendahara/
			// panitia_psb/admin.
			r.Route("/school", func(r chi.Router) {
				r.Group(func(r chi.Router) {
					r.Use(auth.RequireRole("superadmin", "bendahara", "panitia_psb", "admin", "wali_kelas", "pimpinan"))
					r.Get("/classes", schoolHandler.ListClasses)
					r.Get("/years", schoolHandler.ListYears)
				})
				r.Group(func(r chi.Router) {
					r.Use(auth.RequireRole("superadmin", "bendahara", "panitia_psb", "admin"))
					r.Mount("/", schoolHandler.Routes())
				})
			})

			// HR/pegawai: hanya superadmin + bendahara (panitia_psb over-broad).
			r.Group(func(r chi.Router) {
				r.Use(auth.RequireRole("superadmin", "bendahara"))
				r.Mount("/hr", hrHandler.Routes())
			})

			// Panitia PSB Ops
			r.Group(func(r chi.Router) {
				r.Use(auth.RequireRole("panitia_psb"))
				r.Mount("/psb", psbHandler.Routes())
				r.Mount("/contact", messageHandler.Routes())
			})

			// Kesantrian (Data Santri)
			r.Group(func(r chi.Router) {
				r.Use(auth.RequireRole("superadmin", "panitia_psb", "wali_kelas", "pimpinan"))
				r.Mount("/santri", santriHandler.Routes())
			})

			// Academics Ops (LMS ALMAA: Project & E-Raport)
			r.Group(func(r chi.Router) {
				r.Use(auth.RequireRole("superadmin", "admin", "pimpinan", "wali_kelas", "ustadz"))
				r.Mount("/project", projectHandler.Routes())
				r.Mount("/raport", raportHandler.Routes())
			})

			// Invoice manual oleh panitia/bendahara. Webhook gateway tetap publik + HMAC.
			r.Group(func(r chi.Router) {
				r.Use(auth.RequireRole("superadmin", "bendahara", "panitia_psb"))
				r.Post("/invoices", invoiceHandler.Create)
			})

			// Portal PSB for calon santri / wali
			r.Group(func(r chi.Router) {
				r.Use(auth.RequireRole("user"))
				r.Get("/psb/me", psbHandler.GetMine)
				r.Get("/psb/me/receipt", psbHandler.GetMyReceipt)
				r.Put("/psb/me", psbHandler.SaveMine)
				r.Put("/psb/me/documents", psbHandler.SaveMyDocuments)
				r.Put("/psb/me/payment", psbHandler.SaveMyPayment)
				r.Get("/portal/academics/grades", academicHandler.GetMyGrades)
				r.Get("/portal/academics/attendance-summary", academicHandler.GetMyAttendanceSummary)
				r.Get("/my-santri", santriHandler.GetMySantri)
				r.Get("/my-bills", paymentHandler.GetMyBills)
				r.Get("/my-ledger", paymentHandler.GetMyLedger)
				r.Post("/my-bills/spp/{id}/proof", sppHandler.SubmitProof)
				r.Post("/my-bills/iuran/{id}/proof", iuranHandler.SubmitProof)
				r.Get("/my-receipt", paymentHandler.GetMyReceipt)
				r.Get("/portal/raport/me", raportHandler.GetMine)
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

			// Broadcast PSB + log/retry WA PSB: panitia boleh akses (endpoint notifikasi lain tetap superadmin/bendahara).
			r.Group(func(r chi.Router) {
				r.Use(auth.RequireRole("superadmin", "bendahara", "panitia_psb"))
				r.Post("/notifications/broadcast-psb", notificationHandler.BroadcastPSB)
				r.Get("/notifications/wa-log", notificationHandler.GetWALog)
				r.Post("/notifications/wa-retry", notificationHandler.PostWARetry)
			})

			// Academic & Notifications
			r.Group(func(r chi.Router) {
				r.Use(auth.RequireRole("superadmin", "admin", "pimpinan", "wali_kelas", "guru", "ustadz"))
				r.Mount("/academics", academicHandler.Routes())
				r.Mount("/notifications", notificationHandler.Routes())
				r.Post("/attendance/scan", attendanceHandler.Scan)
			})

			// BGN (Beras Bergizi Nasional — penerima manfaat)
			r.Group(func(r chi.Router) {
				r.Use(auth.RequireRole("superadmin", "admin", "bendahara", "panitia_psb"))
				r.Mount("/bgn", bgnHandler.Routes())
			})
		})

	})

	// PHASE 4: proofs privat via handler berauth (chi memprioritaskan node
	// statis /uploads/proofs di atas catch-all /uploads/*).
	// AuthMiddleware WAJIB: ServeProof membaca user dari context.
	r.Group(func(r chi.Router) {
		r.Use(auth.AuthMiddleware)
		r.Get("/uploads/proofs/{file}", upload.ServeProof(database.DB))
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
	srv := &http.Server{
		Addr:              port,
		Handler:           r,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       90 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       120 * time.Second,
	}
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error(context.Background(), "api server stopped unexpectedly", logger.Field{"error": err.Error()})
			os.Exit(1)
		}
	}()

	// PHASE 22: graceful shutdown — berhenti terima request, selesaikan
	// transaksi aktif, tutup DB, hentikan antrean WA dengan aman.
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	logger.Info(context.Background(), "api server shutting down gracefully", nil)
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error(context.Background(), "api server shutdown error", logger.Field{"error": err.Error()})
	}
	if database.DB != nil {
		_ = database.DB.Close()
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

// loadAISettingsFromDB menyuntikkan konfigurasi AI dari tabel settings ke env
// runtime (mirip pola di handler notifications) agar dipakai oleh semua fitur
// yang memanggil platform/ai, termasuk generator artikel berita.
// loadKKMFromDB menyuntikkan ambang KKM akademik dari settings ke runtime
// weight engine agar huruf & predikat mengikuti KKM yang diatur admin.
func loadKKMFromDB(settingRepo *settings.Repository) {
	if v, err := settingRepo.GetByKey("academic_kkm"); err == nil {
		if n, convErr := strconv.Atoi(strings.TrimSpace(v)); convErr == nil && n > 0 {
			weight.SetKKM(n)
			logger.Info(context.Background(), "academic kkm loaded", logger.Field{"kkm": n})
		}
	}
}

func loadAISettingsFromDB(settingRepo *settings.Repository) {
	load := func(key, env string) {
		if v, err := settingRepo.GetByKey(key); err == nil && strings.TrimSpace(v) != "" {
			os.Setenv(env, strings.TrimSpace(v))
		}
	}
	load("ai_openai_key", "AI_OPENAI_KEY")
	load("ai_model", "AI_MODEL")
	if v, err := settingRepo.GetByKey("ai_api_url"); err == nil && strings.TrimSpace(v) != "" {
		apiURL := strings.TrimSpace(v)
		os.Setenv("XKIRO_API_URL", apiURL)
		os.Setenv("OPENAI_API_URL", apiURL)
	}
	logger.Info(context.Background(), "ai settings loaded from db",
		logger.Field{"ai_model": os.Getenv("AI_MODEL"), "ai_api_url": os.Getenv("XKIRO_API_URL"), "has_key": os.Getenv("AI_OPENAI_KEY") != ""})
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
