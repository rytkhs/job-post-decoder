import React from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

interface JobPostingFormProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

export function JobPostingForm({ onSubmit, isLoading }: JobPostingFormProps) {
  const [text, setText] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <div className="mb-4">
        <label htmlFor="job-posting-text" className="block text-sm font-medium mb-2">
          求人票のテキストを貼り付けてください:
        </label>
        <Textarea
          id="job-posting-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="ここに求人票のテキストを貼り付けてください"
          className="min-h-[200px] resize-y"
          disabled={isLoading}
        />
      </div>
      <div className="flex justify-center">
        <Button type="submit" disabled={isLoading || !text.trim()}>
          {isLoading ? 'デコード中...' : 'デコード開始'}
        </Button>
      </div>
    </form>
  );
}
