import { Github } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-black/20 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-foreground">motif-ts</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Dead Simple. Fully Typed. Effortlessly Orchestrated.
            </p>
            <p className="max-w-md text-sm text-muted">Built for reliability and developer experience.</p>
          </div>

          <div className="flex flex-col gap-4 md:items-end">
            <div className="flex items-center gap-6">
              <a
                href="https://github.com/Cryrivers/motif-ts"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
              <a
                href="https://github.com/Cryrivers/motif-ts#readme"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Documentation
              </a>
            </div>
            <div className="text-xs text-muted">
              MIT License • © {new Date().getFullYear()}{' '}
              <a href="https://zhongliang.wang" target="_blank" rel="noopener noreferrer">
                Zhongliang Wang
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
