// Экран «куда прислать код»: почта, MAX, «ВКонтакте», Telegram.
//
// Показываем его только тем, у кого бот подключён: остальным выбирать не из
// чего, и лишний шаг им ни к чему.
import { readFileSync, writeFileSync } from "node:fs";

const p = "src/components/email-auth-flow.tsx";
let s = readFileSync(p, "utf8");
const nl = s.includes("\r\n") ? "\r\n" : "\n";
const L = (...x) => x.join(nl);

const pairs = [
  [
    L("  requestCode,", "  verifyCode,"),
    L("  requestCode,", "  verifyCode,", "  codeChannels,", "  type CodeChannel,"),
  ],
  [
    L('type Step = "email" | "register" | "code";'),
    L(
      'type Step = "email" | "register" | "channel" | "code";',
      "",
      "/** Названия каналов — как их видит человек. */",
      "const CHANNEL_LABEL: Record<CodeChannel, string> = {",
      '  email: "На почту",',
      '  max: "В MAX",',
      '  vk: "Во «ВКонтакте»",',
      '  telegram: "В Telegram",',
      "};",
      "",
      "const CHANNEL_HINT: Record<CodeChannel, string> = {",
      '  email: "письмо приходит за минуту, иногда попадает в спам",',
      '  max: "сообщение от нашего бота — приходит сразу",',
      '  vk: "сообщение от нашего бота — приходит сразу",',
      '  telegram: "сообщение от нашего бота — приходит сразу",',
      "};",
    ),
  ],
  [
    L(
      "  const [noAccount, setNoAccount] = useState(false); // «У меня уже есть аккаунт»",
    ),
    L(
      "  const [noAccount, setNoAccount] = useState(false); // «У меня уже есть аккаунт»",
      "  // Куда можно прислать код. Мессенджер доступен, только если бот уже",
      "  // подключён к аккаунту — иначе боту некуда писать.",
      '  const [channels, setChannels] = useState<CodeChannel[]>(["email"]);',
      '  const [sentTo, setSentTo] = useState<CodeChannel>("email");',
    ),
  ],
  [
    L(
      "      const res = await checkEmail(value);",
      "      if (!res.ok) return setError(res.error);",
      "      if (res.exists) {",
      "        const sent = await sendLoginCode(value);",
      "        if (!sent.ok) return setError(sent.error);",
      '        setMode("login");',
      "        setDevCode(sent.devCode ?? null);",
      '        setStep("code");',
      "      } else {",
    ),
    L(
      "      const res = await checkEmail(value);",
      "      if (!res.ok) return setError(res.error);",
      "      if (res.exists) {",
      '        setMode("login");',
      "        // Если бот подключён — сначала спрашиваем, куда прислать код.",
      "        const list = await codeChannels(value);",
      "        setChannels(list);",
      "        if (list.length > 1) return setStep(\"channel\");",
      "        const sent = await sendLoginCode(value);",
      "        if (!sent.ok) return setError(sent.error);",
      "        setDevCode(sent.devCode ?? null);",
      '        setSentTo(sent.sentTo ?? "email");',
      '        setStep("code");',
      "      } else {",
    ),
  ],
  [
    L(
      "  // Шаг 3 — код из письма.",
      "  function submitCode(e: React.FormEvent) {",
    ),
    L(
      "  // Шаг 2а — выбранный канал доставки кода.",
      "  function chooseChannel(channel: CodeChannel) {",
      "    setError(null);",
      "    startTransition(async () => {",
      "      const sent = await sendLoginCode(email, channel);",
      "      if (!sent.ok) return setError(sent.error);",
      "      setDevCode(sent.devCode ?? null);",
      '      setSentTo(sent.sentTo ?? "email");',
      '      setStep("code");',
      "    });",
      "  }",
      "",
      "  // Шаг 3 — код из письма или из бота.",
      "  function submitCode(e: React.FormEvent) {",
    ),
  ],
  [
    L(
      "      const res =",
      '        mode === "register"',
      "          ? await requestCode({ firstName, lastName, email })",
      "          : await sendLoginCode(email);",
      "      if (res.ok) setDevCode(res.devCode ?? null);",
      "      else setError(res.error);",
    ),
    L(
      "      const res =",
      '        mode === "register"',
      "          ? await requestCode({ firstName, lastName, email })",
      "          : await sendLoginCode(email, sentTo);",
      "      if (res.ok) {",
      "        setDevCode(res.devCode ?? null);",
      '        setSentTo(res.sentTo ?? "email");',
      "      } else setError(res.error);",
    ),
  ],
  [
    L('      {step === "code" && ('),
    L(
      '      {step === "channel" && (',
      '        <div className="space-y-3">',
      "          <button",
      '            type="button"',
      "            onClick={goToEmail}",
      '            className="inline-flex items-center gap-1.5 text-sm text-[#6b7078] hover:text-[#1A1A1A]"',
      "          >",
      '            <ArrowLeft className="size-4" /> Изменить email',
      "          </button>",
      '          <p className="text-sm text-[#4D4D4D]">',
      "            Куда прислать код для входа?",
      "          </p>",
      "          {channels.map((c) => (",
      "            <button",
      "              key={c}",
      '              type="button"',
      "              disabled={pending}",
      "              onClick={() => chooseChannel(c)}",
      '              className="w-full rounded-xl border border-black/[0.1] bg-white px-4 py-3 text-left shadow-sm transition-colors hover:border-[#8E1D2C]/40 disabled:opacity-60"',
      "            >",
      '              <span className="block text-sm font-semibold text-[#1A1A1A]">',
      "                {CHANNEL_LABEL[c]}",
      "              </span>",
      '              <span className="mt-0.5 block text-xs text-[#6b7078]">',
      "                {CHANNEL_HINT[c]}",
      "              </span>",
      "            </button>",
      "          ))}",
      '          {error && <p className="text-sm text-[#8E1D2C]">{error}</p>}',
      "        </div>",
      "      )}",
      "",
      '      {step === "code" && (',
    ),
  ],
  [
    L(
      "          <p className=\"text-sm text-[#4D4D4D]\">",
      "            Код отправлен на <span className=\"font-semibold\">{email}</span>.",
      "            Введите его ниже.",
      "          </p>",
    ),
    L(
      "          <p className=\"text-sm text-[#4D4D4D]\">",
      '            {sentTo === "email" ? (',
      "              <>",
      "                Код отправлен на{\" \"}",
      '                <span className="font-semibold">{email}</span>. Введите его ниже.',
      "              </>",
      "            ) : (",
      "              <>",
      "                Код отправлен сообщением{\" \"}",
      '                <span className="font-semibold">',
      '                  {sentTo === "max" ? "в MAX" : sentTo === "vk" ? "во «ВКонтакте»" : "в Telegram"}',
      "                </span>{\" \"}",
      "                — откройте чат с нашим ботом.",
      "              </>",
      "            )}",
      "          </p>",
    ),
  ],
];
for (const [from, to] of pairs) {
  if (!s.includes(from)) throw new Error("не нашла: " + from.split(nl)[0].slice(0, 60));
  s = s.replace(from, to);
}
writeFileSync(p, s, "utf8");
console.log("правлено:", p);
