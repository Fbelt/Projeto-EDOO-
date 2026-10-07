// windows.h precisa vir antes de tudo (por causa do "using namespace std")
#ifdef _WIN32
#define WIN32_LEAN_AND_MEAN
#define NOMINMAX
#include <windows.h>
#else
#include <unistd.h>
#endif

#include <iostream>
#include <sstream>
#include <iomanip>
#include "Ui.h"

using namespace std;

namespace ui {

// ── Paleta ─────────────────────────────────────────────────────────
// Cores pensadas para terminal escuro, com contraste >= 4.5:1 no texto
struct Rgb { int r, g, b; };

static const Rgb C_TEXT    = {230, 232, 240};
static const Rgb C_MUTED   = {150, 158, 180};
static const Rgb C_BORDER  = {104, 112, 140};
static const Rgb C_GOOD    = { 74, 222, 128};
static const Rgb C_BAD     = {248, 113, 113};
static const Rgb C_WARN    = {251, 191,  36};
static const Rgb C_INFO    = {125, 211, 252};
static const Rgb C_INK     = { 15,  17,  26};   // texto escuro sobre "pílulas"

static const Rgb THEMES[] = {
    {167, 139, 250},   // NEUTRAL  violeta
    {129, 140, 248},   // ADMIN    índigo
    { 45, 212, 191},   // TEACHER  verde-água
    {240, 171, 252},   // STUDENT  orquídea
};

static const int WIDTH = 76;            // largura útil da tela
static const string PAD = "  ";         // recuo padrão (2 colunas)

static Theme currentTheme = NEUTRAL;
static string currentProfile = "";

static const string RESET = "\033[0m";

static string fg(Rgb c) {
    return "\033[38;2;" + to_string(c.r) + ";" + to_string(c.g) + ";" + to_string(c.b) + "m";
}
static string bg(Rgb c) {
    return "\033[48;2;" + to_string(c.r) + ";" + to_string(c.g) + ";" + to_string(c.b) + "m";
}
static Rgb themeColor() { return THEMES[currentTheme]; }

static void sleepMs(int ms) {
#ifdef _WIN32
    Sleep(ms);
#else
    usleep(ms * 1000);
#endif
}

// Largura que o texto ocupa na tela: ignora códigos de cor
// e conta cada caractere UTF-8 (ex: "ç", "│") como 1 coluna
static int visibleWidth(const string& s) {
    int width = 0;
    for (size_t i = 0; i < s.size(); i++) {
        unsigned char c = s[i];
        if (c == '\033') {
            while (i < s.size() && s[i] != 'm') i++;
            continue;
        }
        if ((c & 0xC0) != 0x80) width++;
    }
    return width;
}

static string repeat(const string& piece, int times) {
    string out;
    for (int i = 0; i < times; i++) out += piece;
    return out;
}

static string padRight(const string& s, int width) {
    int w = visibleWidth(s);
    return w >= width ? s : s + string(width - w, ' ');
}

static string padLeft(const string& s, int width) {
    int w = visibleWidth(s);
    return w >= width ? s : string(width - w, ' ') + s;
}

// Separa uma string UTF-8 em caracteres (para pintar letra por letra)
static vector<string> utf8Chars(const string& s) {
    vector<string> chars;
    for (size_t i = 0; i < s.size();) {
        unsigned char c = s[i];
        int len = 1;
        if (c >= 0xF0) len = 4;
        else if (c >= 0xE0) len = 3;
        else if (c >= 0xC0) len = 2;
        chars.push_back(s.substr(i, len));
        i += len;
    }
    return chars;
}

static Rgb mix(Rgb a, Rgb b, double t) {
    return { (int)(a.r + (b.r - a.r) * t), (int)(a.g + (b.g - a.g) * t), (int)(a.b + (b.b - a.b) * t) };
}

// ── Pedaços de texto ───────────────────────────────────────────────
string bold(const string& s)   { return "\033[1m" + fg(C_TEXT) + s + RESET; }
string muted(const string& s)  { return fg(C_MUTED) + s + RESET; }
string accent(const string& s) { return "\033[1m" + fg(themeColor()) + s + RESET; }
string good(const string& s)   { return fg(C_GOOD) + s + RESET; }
string bad(const string& s)    { return fg(C_BAD) + s + RESET; }
string warn(const string& s)   { return fg(C_WARN) + s + RESET; }
static string border(const string& s) { return fg(C_BORDER) + s + RESET; }

string number(double value, int decimals) {
    ostringstream out;
    out << fixed << setprecision(decimals) << value;
    return out.str();
}

string gradeText(double grade) {
    string s = number(grade);
    if (grade >= 7) return good(s);
    if (grade >= 3) return warn(s);
    return bad(s);
}

string statusBadge(const string& status) {
    if (status == "Aprovado")       return good("✔ " + status);
    if (status == "Cursando")       return fg(C_INFO) + "◷ " + status + RESET;
    if (status == "Em prova final") return warn("⚑ " + status);
    return bad("✖ " + status);   // reprovado por nota ou por falta
}

string attendanceBar(double percent) {
    const int cells = 10;
    int filled = (int)(percent / 100.0 * cells + 0.5);
    Rgb color = percent >= 75 ? C_GOOD : C_BAD;
    return fg(color) + repeat("█", filled) + RESET + border(repeat("░", cells - filled)) + " " +
           padLeft(number(percent, 0) + "%", 4);
}

string upper(const string& s) {
    string out = s;
    for (char& c : out) {
        if (c >= 'a' && c <= 'z') c = c - 'a' + 'A';
    }
    return out;
}

// ── Configuração ───────────────────────────────────────────────────
void setup() {
#ifdef _WIN32
    // Faz o console do Windows entender UTF-8 e os códigos de cor
    SetConsoleOutputCP(CP_UTF8);
    SetConsoleCP(CP_UTF8);
    HANDLE out = GetStdHandle(STD_OUTPUT_HANDLE);
    DWORD mode = 0;
    if (GetConsoleMode(out, &mode)) {
        SetConsoleMode(out, mode | 0x0004);   // ENABLE_VIRTUAL_TERMINAL_PROCESSING
    }
#endif
}

void setTheme(Theme theme, const string& profileLabel) {
    currentTheme = theme;
    currentProfile = profileLabel;
}

void clear() {
    cout << "\033[2J\033[3J\033[H" << flush;
}

// ── Abertura ───────────────────────────────────────────────────────
void splash() {
    clear();
    const vector<string> logo = {
        "███████╗██████╗  ██████╗  ██████╗ ",
        "██╔════╝██╔══██╗██╔═══██╗██╔═══██╗",
        "█████╗  ██║  ██║██║   ██║██║   ██║",
        "██╔══╝  ██║  ██║██║   ██║██║   ██║",
        "███████╗██████╔╝╚██████╔╝╚██████╔╝",
        "╚══════╝╚═════╝  ╚═════╝  ╚═════╝ ",
    };
    Rgb from = THEMES[NEUTRAL];
    Rgb to = THEMES[TEACHER];

    cout << "\n\n";
    for (const string& line : logo) {
        vector<string> chars = utf8Chars(line);
        cout << PAD << PAD;
        for (size_t i = 0; i < chars.size(); i++) {
            // degradê da esquerda (violeta) para a direita (verde-água)
            cout << fg(mix(from, to, (double)i / chars.size())) << chars[i];
        }
        cout << RESET << "\n" << flush;
        sleepMs(55);
    }
    cout << "\n" << PAD << PAD << bold("Sistema de Gestão Acadêmica") << "\n";
    cout << PAD << PAD << muted("CIN0135 · Estruturas de Dados Orientadas a Objetos · CIn/UFPE") << "\n\n";
}

void step(const string& label) {
    const vector<string> frames = {"⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"};
    for (int i = 0; i < 8; i++) {
        cout << "\r" << PAD << PAD << accent(frames[i % frames.size()]) << " " << muted(label) << flush;
        sleepMs(35);
    }
    cout << "\r" << PAD << PAD << good("✔") << " " << label << "   \n" << flush;
}

void goodbye() {
    clear();
    setTheme(NEUTRAL, "");
    cout << "\n" << PAD << accent("◆") << " " << bold("Até logo!") << "\n";
    cout << PAD << muted("  Tudo foi salvo em data/escola.db") << "\n\n";
}

// ── Topo de cada tela ──────────────────────────────────────────────
void screen(const string& path) {
    clear();
    Rgb color = themeColor();

    // Linha 1: marca à esquerda, "pílula" do perfil à direita
    string brand = accent("◆ EDOO") + muted(" Acadêmico");
    string pill = "";
    if (currentProfile != "") {
        pill = bg(color) + fg(C_INK) + "\033[1m " + upper(currentProfile) + " " + RESET;
    }
    int gap = WIDTH - visibleWidth(brand) - visibleWidth(pill);
    cout << "\n" << PAD << brand << string(gap > 1 ? gap : 1, ' ') << pill << "\n";

    // Linha 2: caminho (breadcrumb). A última parte fica em destaque
    string full = "Início" + (path == "" ? "" : " › " + path);
    size_t last = full.rfind(" › ");
    string trail = last == string::npos ? bold(full)
                                        : muted(full.substr(0, last + 5)) + bold(full.substr(last + 5));
    cout << PAD << trail << "\n";
    cout << PAD << border(repeat("─", WIDTH)) << "\n\n";
}

// ── Textos ─────────────────────────────────────────────────────────
void title(const string& text, const string& subtitle) {
    cout << PAD << fg(themeColor()) << "▍" << RESET << bold(text) << "\n";
    if (subtitle != "") {
        cout << PAD << "  " << muted(subtitle) << "\n";
    }
    cout << "\n";
}

void section(const string& text) {
    cout << "\n" << PAD << muted(text) << " " << border(repeat("─", WIDTH - visibleWidth(text) - 1)) << "\n";
}

void text(const string& s) { cout << PAD << s << "\n"; }
void blank() { cout << "\n"; }

void option(const string& key, const string& label, const string& hint) {
    cout << PAD << PAD << accent(padLeft(key, 2)) << border(" │ ") << padRight(label, 28)
         << muted(hint) << "\n";
}

void backOption(const string& label) {
    cout << "\n" << PAD << PAD << muted(padLeft("0", 2)) << border(" │ ") << muted("← " + label) << "\n";
}

// ── Mensagens ──────────────────────────────────────────────────────
void success(const string& msg) { cout << "\n" << PAD << good("✔ " + msg) << "\n"; }
void warning(const string& msg) { cout << "\n" << PAD << warn("▲ " + msg) << "\n"; }
void info(const string& msg)    { cout << "\n" << PAD << fg(C_INFO) << "● " << msg << RESET << "\n"; }

void error(const string& msg, const string& hint) {
    cout << "\n" << PAD << bad("✖ " + msg) << "\n";
    if (hint != "") {
        cout << PAD << "  " << muted("↳ " + hint) << "\n";
    }
}

// ── Entrada ────────────────────────────────────────────────────────
void prompt(const string& label) {
    cout << "\n" << PAD << accent("❯") << " " << label << muted(": ") << flush;
}

void pause() {
    cout << "\n" << PAD << muted("Pressione ENTER para continuar…") << flush;
    string ignored;
    getline(cin, ignored);
}

// ── Cartões ────────────────────────────────────────────────────────
void statCards(const vector<string>& values, const vector<string>& labels) {
    const int w = 19;   // largura interna de cada cartão
    string top, mid, low, bottom;
    for (size_t i = 0; i < values.size(); i++) {
        top    += border("╭" + repeat("─", w) + "╮") + " ";
        mid    += border("│") + " " + accent(padRight(values[i], w - 1)) + border("│") + " ";
        low    += border("│") + " " + muted(padRight(labels[i], w - 1)) + border("│") + " ";
        bottom += border("╰" + repeat("─", w) + "╯") + " ";
    }
    cout << PAD << top << "\n" << PAD << mid << "\n" << PAD << low << "\n" << PAD << bottom << "\n";
}

void profileCard(const string& name, const vector<string>& details) {
    int w = WIDTH - 2;
    cout << PAD << border("╭" + repeat("─", w) + "╮") << "\n";
    cout << PAD << border("│") << "  " << fg(themeColor()) << "● " << RESET
         << padRight(bold(name), w - 4) << border("│") << "\n";
    for (const string& d : details) {
        cout << PAD << border("│") << "    " << padRight(muted(d), w - 4) << border("│") << "\n";
    }
    cout << PAD << border("╰" + repeat("─", w) + "╯") << "\n";
}

// ── Tabela ─────────────────────────────────────────────────────────
Table::Table(const vector<string>& h) {
    headers = h;
    right = vector<bool>(h.size(), false);
}

void Table::alignRight(int column) { right[column] = true; }
void Table::add(const vector<string>& row) { rows.push_back(row); }
bool Table::empty() { return rows.empty(); }

void Table::print() {
    // 1) largura de cada coluna = maior texto da coluna
    vector<int> widths;
    for (const string& h : headers) widths.push_back(visibleWidth(h));
    for (const vector<string>& row : rows) {
        for (size_t c = 0; c < row.size() && c < widths.size(); c++) {
            if (visibleWidth(row[c]) > widths[c]) widths[c] = visibleWidth(row[c]);
        }
    }

    // 2) linhas de borda
    auto line = [&](string left, string middle, string rightEnd) {
        string out = left;
        for (size_t c = 0; c < widths.size(); c++) {
            out += repeat("─", widths[c] + 2) + (c + 1 < widths.size() ? middle : rightEnd);
        }
        return border(out);
    };
    auto cell = [&](const string& s, size_t c) {
        return " " + (right[c] ? padLeft(s, widths[c]) : padRight(s, widths[c])) + " ";
    };

    // 3) desenha
    cout << PAD << line("╭", "┬", "╮") << "\n" << PAD << border("│");
    for (size_t c = 0; c < headers.size(); c++) {
        cout << cell(accent(headers[c]), c) << border("│");
    }
    cout << "\n" << PAD << line("├", "┼", "┤") << "\n";

    if (rows.empty()) {
        int inner = 0;
        for (int w : widths) inner += w + 3;
        cout << PAD << border("│") << padRight(muted(" Nada para mostrar"), inner - 1) << border("│") << "\n";
    }
    for (const vector<string>& row : rows) {
        cout << PAD << border("│");
        for (size_t c = 0; c < headers.size(); c++) {
            cout << cell(c < row.size() ? row[c] : "", c) << border("│");
        }
        cout << "\n";
    }
    cout << PAD << line("╰", "┴", "╯") << "\n";
}

}  // namespace ui
