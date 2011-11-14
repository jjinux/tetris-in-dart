// Package main is a small application written in Go for Google App Engine.  It
// asks the user to solve an arithmetic problem using arbitrary-precision
// arithmetic.
package main

import (
	"fmt"
	"http"
	"template"
)

const nextUrl = "http://jjinux.blogspot.com"

type templateParams struct {
	Msg      string
	ShowForm bool
}

// Add all the template names here.
var templateNames = []string{"main"}

var templates = make(map[string]*template.Template)

// These are the last 5 digits of 2^274 in string form.  I couldn't find an easy way to do this in Go,
// so I just ran the following bit of Python, "str(2 ** 274)[-5:]".
var answer = "82784"

func mainHandler(w http.ResponseWriter, r *http.Request) {
	params := &templateParams{Msg: "", ShowForm: true}
	if r.Method == "POST" {
		if answer == r.FormValue("answer") {
			params.Msg = fmt.Sprintf("Correct!  Click <a href=\"%s\">here</a> to continue.", nextUrl)
			params.ShowForm = false
		} else {
			params.Msg = "Sorry, that's not quite right.  Try again."
		}
	}
	renderTemplate(w, "main", params)
}

func renderTemplate(w http.ResponseWriter, tmpl string, params *templateParams) {
	err := templates[tmpl].Execute(w, params)
	if err != nil {
		http.Error(w, err.String(), http.StatusInternalServerError)
	}
}

func init() {
	for _, tmpl := range templateNames {
		templates[tmpl] = template.MustParseFile(tmpl+".html", nil)
	}
}

func main() {
	http.HandleFunc("/", mainHandler)
	http.ListenAndServe(":8080", nil)
}
