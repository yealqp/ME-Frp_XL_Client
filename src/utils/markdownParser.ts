import { marked } from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import bash from 'highlight.js/lib/languages/bash'
import ini from 'highlight.js/lib/languages/ini'
import json from 'highlight.js/lib/languages/json'
import yaml from 'highlight.js/lib/languages/yaml'
import xml from 'highlight.js/lib/languages/xml'

import 'highlight.js/styles/github-dark.css'

// Register languages
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('typescript', javascript)
hljs.registerLanguage('ts', javascript)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('sh', bash)
hljs.registerLanguage('ini', ini)
hljs.registerLanguage('toml', ini)
hljs.registerLanguage('json', json)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('yml', yaml)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('xml', xml)

// Configure marked
marked.setOptions({
  gfm: true,
  breaks: true,
})

/**
 * Unescape special characters in content
 */
function unescapeContent(content: string): string {
  return content
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '\r')
    .replace(/\\\\/g, '\\')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\&/g, '&')
    .replace(/\\</g, '<')
    .replace(/\\>/g, '>')
}

/**
 * Parse markdown content to HTML
 * Uses marked for parsing, DOMPurify for sanitization, and highlight.js for code highlighting
 *
 * @param content - The markdown content to parse
 * @returns The parsed HTML string
 */
export function parseMarkdown(content: string): string {
  if (!content) return ''

  const unescaped = unescapeContent(content)

  try {
    // Parse markdown
    let html = marked.parse(unescaped) as string

    // Sanitize
    html = DOMPurify.sanitize(html)

    // Apply code highlighting and inline-code classes via temp DOM
    if (typeof document !== 'undefined') {
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = html

      // Apply hljs to code blocks
      tempDiv.querySelectorAll('pre code').forEach((el) => {
        try {
          const langClasses = Array.from(el.classList).filter((cls) =>
            cls.startsWith('language-'),
          )
          if (langClasses.length > 0) {
            const lang = langClasses[0].replace('language-', '').trim()
            if (hljs.getLanguage(lang)) {
              hljs.highlightElement(el as HTMLElement)
            }
          } else {
            const codeText = el.textContent || ''
            const result = hljs.highlightAuto(codeText)
            el.innerHTML = result.value
            el.classList.add('hljs')
            if (result.language) {
              el.classList.add(`language-${result.language}`)
            }
          }
        } catch (e) {
          console.error('Code highlight error:', e)
        }
      })

      // Add inline-code class to inline code elements
      tempDiv.querySelectorAll('p code, li code, td code, th code').forEach((el) => {
        el.classList.add('inline-code')
      })

      html = tempDiv.innerHTML
    }

    return html
  } catch (error) {
    console.error('Markdown parsing failed:', error)
    return unescaped.replace(/\n/g, '<br>')
  }
}
