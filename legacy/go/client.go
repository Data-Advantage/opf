package pptxdev

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/url"
	"strings"
)

// DefaultBaseURL is the production API host (paths are /v1/...).
const DefaultBaseURL = "https://api.pptx.dev"

// Client calls the pptx.dev HTTP API.
type Client struct {
	baseURL    *url.URL
	apiKey     string
	httpClient *http.Client
}

// ClientOption configures [NewClient].
type ClientOption func(*Client) error

// WithBaseURL overrides the API base URL, for example
// "http://localhost:3000/api" for a local Next.js dev server.
func WithBaseURL(raw string) ClientOption {
	return func(c *Client) error {
		u, err := url.Parse(raw)
		if err != nil {
			return fmt.Errorf("pptxdev: base url: %w", err)
		}
		c.baseURL = u
		return nil
	}
}

// WithHTTPClient sets the HTTP client used for requests (timeouts, tracing, etc.).
func WithHTTPClient(hc *http.Client) ClientOption {
	return func(c *Client) error {
		if hc == nil {
			return fmt.Errorf("pptxdev: http client must not be nil")
		}
		c.httpClient = hc
		return nil
	}
}

// NewClient returns a client that sends Authorization: Bearer <apiKey> when apiKey is non-empty.
func NewClient(apiKey string, opts ...ClientOption) (*Client, error) {
	u, err := url.Parse(DefaultBaseURL)
	if err != nil {
		return nil, fmt.Errorf("pptxdev: default base url: %w", err)
	}
	c := &Client{
		baseURL:    u,
		apiKey:     apiKey,
		httpClient: http.DefaultClient,
	}
	for _, opt := range opts {
		if err := opt(c); err != nil {
			return nil, err
		}
	}
	return c, nil
}

func (c *Client) endpoint(parts ...string) *url.URL {
	return c.baseURL.JoinPath(parts...)
}

func (c *Client) setAuth(req *http.Request) {
	if c.apiKey != "" {
		req.Header.Set("Authorization", "Bearer "+c.apiKey)
	}
}

func (c *Client) doJSON(ctx context.Context, method string, query url.Values, body []byte, out any, pathParts ...string) error {
	u := c.endpoint(pathParts...)
	if len(query) > 0 {
		u.RawQuery = query.Encode()
	}
	var rdr io.Reader
	if body != nil {
		rdr = bytes.NewReader(body)
	}
	req, err := http.NewRequestWithContext(ctx, method, u.String(), rdr)
	if err != nil {
		return err
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	c.setAuth(req)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return apiErrorFromResponse(resp, respBody)
	}
	if out == nil {
		return nil
	}
	if err := json.Unmarshal(respBody, out); err != nil {
		return fmt.Errorf("pptxdev: decode json: %w", err)
	}
	return nil
}

func (c *Client) postMultipart(ctx context.Context, query url.Values, fieldName, filename string, file io.Reader, accept string, out any, pathParts ...string) error {
	u := c.endpoint(pathParts...)
	if len(query) > 0 {
		u.RawQuery = query.Encode()
	}
	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	part, err := w.CreateFormFile(fieldName, filename)
	if err != nil {
		return err
	}
	if _, err := io.Copy(part, file); err != nil {
		return err
	}
	if err := w.Close(); err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, u.String(), &buf)
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", w.FormDataContentType())
	if accept != "" {
		req.Header.Set("Accept", accept)
	}
	c.setAuth(req)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return apiErrorFromResponse(resp, respBody)
	}
	if out == nil {
		return nil
	}
	if err := json.Unmarshal(respBody, out); err != nil {
		return fmt.Errorf("pptxdev: decode json: %w", err)
	}
	return nil
}

func joinIntsComma(nums []int) string {
	if len(nums) == 0 {
		return ""
	}
	var b strings.Builder
	for i, n := range nums {
		if i > 0 {
			b.WriteByte(',')
		}
		b.WriteString(fmt.Sprintf("%d", n))
	}
	return b.String()
}
