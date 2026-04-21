type AuthDividerProps = {
  label?: string;
};

export function AuthDivider({ label = 'Or' }: AuthDividerProps) {
  return <div className="auth-divider">{label}</div>;
}
