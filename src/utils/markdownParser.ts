import MarkdownIt from 'markdown-it';

/**
 * Singleton class for parsing Markdown content
 * Provides a pre-configured markdown-it instance with custom rendering rules
 */
class MarkdownParser {
  private static instance: MarkdownParser;
  private md: MarkdownIt;

  private constructor() {
    this.md = new MarkdownIt({
      html: true,
      breaks: true,
      linkify: true,
    });

    this.configureRenderer();
  }

  /**
   * Get the singleton instance of MarkdownParser
   */
  public static getInstance(): MarkdownParser {
    if (!MarkdownParser.instance) {
      MarkdownParser.instance = new MarkdownParser();
    }
    return MarkdownParser.instance;
  }

  /**
   * Configure custom rendering rules
   */
  private configureRenderer(): void {
    // Add target="_blank" to all links and handle relative URLs
    const defaultRender = this.md.renderer.rules.link_open ||
      function (tokens: any, idx: any, options: any, _env: any, self: any) {
        return self.renderToken(tokens, idx, options);
      };

    this.md.renderer.rules.link_open = function (
      tokens: any,
      idx: any,
      options: any,
      _env: any,
      self: any,
    ) {
      const aIndex = tokens[idx].attrIndex('target');
      if (aIndex < 0) {
        tokens[idx].attrPush(['target', '_blank']);
        tokens[idx].attrPush(['rel', 'noopener noreferrer']);
      }

      // Handle relative URLs starting with /
      const hrefIndex = tokens[idx].attrIndex('href');
      if (hrefIndex >= 0) {
        const href = tokens[idx].attrs[hrefIndex][1];
        // If href starts with /, prepend the base URL
        if (href.startsWith('/')) {
          tokens[idx].attrs[hrefIndex][1] = 'https://www.mefrp.com' + href;
        }
      }

      return defaultRender(tokens, idx, options, _env, self);
    };
  }

  /**
   * Parse markdown content to HTML
   * @param content - The markdown content to parse
   * @returns The parsed HTML string
   */
  public parse(content: string): string {
    if (!content) return '';

    // Unescape content
    const unescapedContent = this.unescapeContent(content);

    try {
      let html = this.md.render(unescapedContent);

      // Post-processing
      html = this.postProcess(html);

      return html;
    } catch (error) {
      console.error('Markdown parsing failed:', error);
      return unescapedContent.replace(/\n/g, '<br>');
    }
  }

  /**
   * Unescape special characters in content
   */
  private unescapeContent(content: string): string {
    return content
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\r/g, '\r')
      .replace(/\\\\/g, '\\')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/\\&/g, '&')
      .replace(/\\</g, '<')
      .replace(/\\>/g, '>');
  }

  /**
   * Post-process the rendered HTML
   */
  private postProcess(html: string): string {
    // Add divider after h2
    html = html.replace(
      /<h2>(.*?)<\/h2>/g,
      '<h2>$1</h2><hr class="h2-divider">',
    );

    // Add class to inline code
    html = html.replace(/<code>(?!<\/code>)/g, '<code class="inline-code">');

    // Add class to blockquote
    html = html.replace(
      /<blockquote>/g,
      '<blockquote class="custom-blockquote">',
    );

    return html;
  }

  /**
   * Add a plugin to the markdown-it instance
   * @param plugin - The plugin to add
   * @param options - Plugin options
   */
  public use(plugin: any, options?: any): this {
    this.md.use(plugin, options);
    return this;
  }
}

// Export singleton instance
export const markdownParser = MarkdownParser.getInstance();

/**
 * Convenience function to parse markdown content
 * @param content - The markdown content to parse
 * @returns The parsed HTML string
 */
export function parseMarkdown(content: string): string {
  return markdownParser.parse(content);
}
