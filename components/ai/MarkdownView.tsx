"use client";

import React, { useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

interface MarkdownViewProps {
  content: string;
  className?: string;
}

export default function MarkdownView({ content, className = "" }: MarkdownViewProps) {
  const sanitizedHtml = useMemo(() => {
    try {
      // Configure marked for clean standard output
      marked.setOptions({
        gfm: true,
        breaks: true,
      });
      const rawHtml = marked.parse(content) as string;
      return DOMPurify.sanitize(rawHtml);
    } catch {
      return content;
    }
  }, [content]);

  return (
    <div
      className={`prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed text-xs sm:text-sm [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:list-disc [&>ul]:pl-4 [&>ul]:mb-2 [&>ol]:list-decimal [&>ol]:pl-4 [&>ol]:mb-2 [&>h3]:text-sm [&>h3]:font-bold [&>h3]:mt-3 [&>h3]:mb-1.5 [&>h4]:text-xs [&>h4]:font-semibold [&>h4]:mt-2 [&>h4]:mb-1 [&>hr]:my-2 [&>hr]:border-border [&>blockquote]:border-l-2 [&>blockquote]:border-amber-500 [&>blockquote]:pl-2 [&>blockquote]:italic ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}

