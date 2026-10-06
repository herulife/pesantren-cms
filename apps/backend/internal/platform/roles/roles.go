// Package roles holds the single canonical list of assignable user roles.
//
// This is the only place role names are validated. Validators, the repository
// layer and the database CHECK constraint all agree on this list so a role can
// never be accepted by one layer and rejected by another.
//
// The legacy "admin" role was removed deliberately: no route ever granted it
// access, yet it was still assignable and was silently promoted to "superadmin"
// on every boot, which was the escalation path used during the breach.
package roles

import "sort"

// Assignable lists every role that may be stored on a user row.
var Assignable = []string{
	"superadmin",
	"bendahara",
	"panitia_psb",
	"tim_media",
	"user",
}

var assignableSet = func() map[string]bool {
	m := make(map[string]bool, len(Assignable))
	for _, r := range Assignable {
		m[r] = true
	}
	return m
}()

// IsAssignable reports whether role is a valid, storable role.
func IsAssignable(role string) bool {
	return assignableSet[role]
}

// Sorted returns Assignable in a stable order, for error messages and docs.
func Sorted() []string {
	out := append([]string(nil), Assignable...)
	sort.Strings(out)
	return out
}

// SQLList renders Assignable as a quoted, comma separated list safe to embed in
// a DDL CHECK constraint. Roles are compile-time constants, so the quoting here
// is purely defensive.
func SQLList() string {
	out := ""
	for i, r := range Sorted() {
		if i > 0 {
			out += ", "
		}
		out += "'" + r + "'"
	}
	return out
}