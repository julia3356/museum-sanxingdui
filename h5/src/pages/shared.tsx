import { ReactNode } from 'react';
import { getAppPath, navigate, withBase } from '../lib/paths';

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
  const path = getAppPath();
  const links = [
    { to: '/sanxingdui/', label: '导引', match: path === '/sanxingdui' || path === '/sanxingdui/' },
    { to: '/sanxingdui/segments', label: '展品', match: path.startsWith('/sanxingdui/segments') },
    { to: '/sanxingdui/ask', label: '问答', match: path.startsWith('/sanxingdui/ask') },
    { to: '/sanxingdui/sources', label: '来源', match: path === '/sanxingdui/sources' },
  ];

  return (
    <nav className="bottom-nav" aria-label="三星堆看展导航">
      {links.map((link) => (
        <LinkButton
          to={link.to}
          className={link.match ? 'nav-link active' : 'nav-link'}
          key={link.to}
        >
          {link.label}
        </LinkButton>
      ))}
    </nav>
  );
}
