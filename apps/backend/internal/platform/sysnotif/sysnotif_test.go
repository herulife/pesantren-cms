package sysnotif

import (
	"context"
	"database/sql"
	"testing"

	_ "modernc.org/sqlite"
)

func newTestDB(t *testing.T) *sql.DB {
	t.Helper()
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	db.SetMaxOpenConns(1)
	schema := `
	CREATE TABLE sys_notifications (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		type TEXT NOT NULL,
		title TEXT NOT NULL,
		message TEXT NOT NULL,
		link TEXT NOT NULL DEFAULT '',
		created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
	);
	CREATE TABLE sys_notification_reads (
		user_id INTEGER NOT NULL,
		notification_id INTEGER NOT NULL,
		read_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		PRIMARY KEY (user_id, notification_id)
	);`
	if _, err := db.Exec(schema); err != nil {
		t.Fatalf("create schema: %v", err)
	}
	return db
}

func TestEmitterRoundTrip(t *testing.T) {
	db := newTestDB(t)
	ctx := context.Background()

	if err := Emit(ctx, db, "psb_pendaftar", "Pendaftar PSB baru", "Ujang (SMP)", "/admin/psb"); err != nil {
		t.Fatalf("emit 1: %v", err)
	}
	if err := Emit(ctx, db, "donasi", "Donasi baru tercatat", "Aisyah menyumbang Rp100000", "/admin/donations"); err != nil {
		t.Fatalf("emit 2: %v", err)
	}

	items, unread, err := List(ctx, db, 7)
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(items) != 2 {
		t.Fatalf("expected 2 items, got %d", len(items))
	}
	if items[0].Title != "Donasi baru tercatat" || items[0].Type != "donasi" {
		t.Fatalf("ordering/fields wrong: %+v", items[0])
	}
	if items[0].Read {
		t.Fatalf("should be unread")
	}
	if unread != 2 {
		t.Fatalf("expected unread=2, got %d", unread)
	}
	if items[0].CreatedAt == "" {
		t.Fatalf("created_at not parsed")
	}
}

func TestMarkReadAndReadAll(t *testing.T) {
	db := newTestDB(t)
	ctx := context.Background()
	for i := 0; i < 3; i++ {
		if err := Emit(ctx, db, "pesan_kontak", "Pesan kontak baru", "Dari Budi", "/admin/messages"); err != nil {
			t.Fatalf("emit: %v", err)
		}
	}

	items, _, err := List(ctx, db, 5)
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	first := items[0]

	if err := MarkRead(ctx, db, 5, first.ID); err != nil {
		t.Fatalf("mark read: %v", err)
	}

	n, err := UnreadCount(ctx, db, 5)
	if err != nil {
		t.Fatalf("unread: %v", err)
	}
	if n != 2 {
		t.Fatalf("expected unread=2 after one read, got %d", n)
	}

	// Read bersifat per-user.
	nOther, err := UnreadCount(ctx, db, 9)
	if err != nil {
		t.Fatalf("unread other: %v", err)
	}
	if nOther != 3 {
		t.Fatalf("expected other unread=3, got %d", nOther)
	}

	if err := MarkAllRead(ctx, db, 5); err != nil {
		t.Fatalf("mark all: %v", err)
	}
	n, err = UnreadCount(ctx, db, 5)
	if err != nil {
		t.Fatalf("unread after all: %v", err)
	}
	if n != 0 {
		t.Fatalf("expected unread=0 after read-all, got %d", n)
	}
}

func TestListOrderAndLimit(t *testing.T) {
	db := newTestDB(t)
	ctx := context.Background()
	for i := 0; i < 55; i++ {
		if err := Emit(ctx, db, "user_baru", "Akun baru terdaftar", "Test", "/admin/users"); err != nil {
			t.Fatalf("emit: %v", err)
		}
	}
	items, _, err := List(ctx, db, 1)
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(items) != 50 {
		t.Fatalf("expected 50 items (limit), got %d", len(items))
	}
	if items[0].Message != "Test" {
		t.Fatalf("expected newest first")
	}
}

func TestEmitNilDB(t *testing.T) {
	if err := Emit(context.Background(), nil, "x", "x", "x", "x"); err == nil {
		t.Fatalf("expected error on nil db")
	}
}