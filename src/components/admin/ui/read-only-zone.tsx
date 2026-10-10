/**
 * Область «только просмотр»: у аналитика все кнопки и поля внутри неё
 * отключены (fieldset disabled гасит и кнопки отправки, и поля ввода одним
 * махом), у остальных — без изменений. Это только про вид интерфейса: что
 * действие вообще нельзя выполнить, сервер проверяет сам, по настоящей роли.
 */
export function ReadOnlyZone({ readOnly, children }: { readOnly: boolean; children: React.ReactNode }) {
  if (!readOnly) return <>{children}</>;
  return (
    <fieldset disabled className="contents">
      {children}
    </fieldset>
  );
}
