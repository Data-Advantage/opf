// Package pptxdev is a client for the pptx.dev REST API (https://api.pptx.dev/v1).
//
//	import "pptx.dev/go"
//
// Use [NewClient] with a Clerk user or org API key, then call methods such as
// [Client.Validate] or [Client.ParsePPTX]. OPF payloads are represented as
// [encoding/json.RawMessage] so callers can use their own document types.
package pptxdev
