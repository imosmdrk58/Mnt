import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, Edit, Save, Bold, Italic, List, Quote, Code } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface NovelEditorProps {
  title: string;
  content: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onSave: () => void;
  isSaving?: boolean;
}

export default function NovelEditor({
  title,
  content,
  onTitleChange,
  onContentChange,
  onSave,
  isSaving = false,
}: NovelEditorProps) {
  const [activeTab, setActiveTab] = useState("edit");
  
  const insertMarkdown = (before: string, after: string = "") => {
    const textarea = document.querySelector('#novel-content') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const replacement = before + selectedText + after;
    
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    onContentChange(newContent);
    
    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const formatButtons = [
    { icon: Bold, label: "Bold", action: () => insertMarkdown("**", "**") },
    { icon: Italic, label: "Italic", action: () => insertMarkdown("*", "*") },
    { icon: Quote, label: "Quote", action: () => insertMarkdown("\n> ", "") },
    { icon: List, label: "List", action: () => insertMarkdown("\n- ", "") },
    { icon: Code, label: "Code", action: () => insertMarkdown("`", "`") },
  ];

  return (
    <div className="space-y-4">
      {/* Chapter Title */}
      <div>
        <Label htmlFor="chapter-title">Chapter Title</Label>
        <Input
          id="chapter-title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Enter chapter title..."
          className="mt-1"
        />
      </div>

      {/* Editor Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="edit" className="flex items-center space-x-2">
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </TabsTrigger>
          </TabsList>
          
          <Button 
            onClick={onSave} 
            disabled={isSaving || !title.trim() || !content.trim()}
            className="flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Chapter'}</span>
          </Button>
        </div>

        <TabsContent value="edit" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <CardTitle className="text-sm">Markdown Editor</CardTitle>
                <div className="flex items-center space-x-1">
                  {formatButtons.map((button, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      onClick={button.action}
                      className="h-8 w-8 p-0"
                      title={button.label}
                    >
                      <button.icon className="w-3 h-3" />
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                id="novel-content"
                value={content}
                onChange={(e) => onContentChange(e.target.value)}
                placeholder="Write your novel chapter here using Markdown...

Example:
# Chapter Heading
This is a paragraph with **bold text** and *italic text*.

> This is a quote block

- Bullet point 1
- Bullet point 2

1. Numbered list item
2. Another item

`Inline code` or code blocks:

```
Code block
```

---

Use --- for horizontal rules to separate sections.
"
                className="min-h-[500px] font-mono text-sm resize-none"
                style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace' }}
              />
              <div className="mt-2 text-xs text-muted-foreground">
                {content.split(/\s+/).filter(word => word.length > 0).length} words • {content.split('\n').length} lines
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{title || "Chapter Title"}</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] w-full pr-4">
                <div className="prose prose-lg max-w-none dark:prose-invert">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => <h1 className="text-2xl font-bold mb-4">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-xl font-semibold mb-3">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-lg font-medium mb-2">{children}</h3>,
                      p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-muted pl-4 italic my-4 text-muted-foreground">
                          {children}
                        </blockquote>
                      ),
                      code: ({ children }) => (
                        <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                          {children}
                        </code>
                      ),
                      pre: ({ children }) => (
                        <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-4">
                          {children}
                        </pre>
                      ),
                    }}
                  >
                    {content || "*No content yet. Switch to Edit tab to start writing.*"}
                  </ReactMarkdown>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}