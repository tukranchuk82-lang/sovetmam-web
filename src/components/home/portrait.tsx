// Портрет автора проекта (вырезанная фигура с прозрачным фоном).
// Обычный <img> (без оптимизатора Next) — так замена файла подхватывается сразу,
// без кэша оптимизатора. ?v=N — версия для сброса кэша браузера при замене фото.
export function Portrait({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/founder/butskaya.png?v=2"
      alt="Татьяна Буцкая"
      width={862}
      height={1032}
      className={className}
    />
  );
}
