import { ReactNode } from 'react';
import { navigate, withBase } from '../lib/paths';

type LinkButtonProps = {
  to: string;
  children: ReactNode;
  className?: string;
};

export function LinkButton({ to, children, className = 'button secondary' }: LinkButtonProps) {
  return (
    <a
      className={className}
      href={withBase(to)}
      onClick={(event) => {
        event.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <header className="hero">
      <div className="eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      {action ? <div className="action-row">{action}</div> : null}
    </header>
  );
}

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="三星堆看展导航">
      <LinkButton to="/sanxingdui/" className="nav-link">
        导引
      </LinkButton>
      <LinkButton to="/sanxingdui/segments" className="nav-link">
        展品
      </LinkButton>
      <LinkButton to="/sanxingdui/ask" className="nav-link">
        问答
      </LinkButton>
      <LinkButton to="/sanxingdui/sources" className="nav-link">
        来源
      </LinkButton>
    </nav>
  );
}
