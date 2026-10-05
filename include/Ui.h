#ifndef UI_H
#define UI_H

#include <string>
#include <vector>

using namespace std;

// Parte VISUAL do menu: cores, caixas, tabelas e mensagens.
// Aqui não tem nenhuma regra do sistema, só a aparência.
// Os menus chamam estas funções para desenhar as telas.
namespace ui {

    // Cada perfil tem uma cor de destaque (ajuda o usuário a saber onde está)
    enum Theme { NEUTRAL, ADMIN, TEACHER, STUDENT };

    // ── Configuração e telas ───────────────────────────────────────
    void setup();                                   // liga cores e acentos (Windows)
    void setTheme(Theme theme, const string& profileLabel);
    void clear();                                   // limpa o terminal
    void splash();                                  // logo animada da abertura
    void step(const string& label);                 // linha "✔ etapa" da abertura
    void screen(const string& path);                // limpa e desenha o topo da tela
    void goodbye();

    // ── Textos ─────────────────────────────────────────────────────
    void title(const string& text, const string& subtitle = "");
    void section(const string& text);               // rótulo de grupo (MAIÚSCULO)
    void text(const string& s);                     // parágrafo comum
    void blank();
    void option(const string& key, const string& label, const string& hint = "");
    void backOption(const string& label = "Voltar");

    // ── Mensagens (sempre com ícone, não só cor) ──────────────────
    void success(const string& msg);
    void error(const string& msg, const string& hint = "");
    void warning(const string& msg);
    void info(const string& msg);

    // ── Entrada ────────────────────────────────────────────────────
    void prompt(const string& label);               // "❯ label: "
    void pause();                                   // "Pressione ENTER..."

    // ── Pedaços de texto coloridos ─────────────────────────────────
    string bold(const string& s);
    string muted(const string& s);
    string accent(const string& s);
    string good(const string& s);
    string bad(const string& s);
    string warn(const string& s);
    string number(double value, int decimals = 1);
    string gradeText(double grade);                 // nota colorida (verde/amarelo/vermelho)
    string statusBadge(const string& status);       // "✔ Aprovado", "✖ Reprovado..."
    string attendanceBar(double percent);           // ██████░░░░ 83%
    string upper(const string& s);

    // Cartões com números grandes lado a lado (painel do admin)
    void statCards(const vector<string>& values, const vector<string>& labels);

    // Cartão de perfil (nome em destaque + linhas de detalhe)
    void profileCard(const string& name, const vector<string>& details);

    // Tabela com bordas arredondadas e colunas alinhadas
    class Table {
    private:
        vector<string> headers;
        vector<vector<string>> rows;
        vector<bool> right;   // true = coluna alinhada à direita (números)

    public:
        Table(const vector<string>& h);
        void alignRight(int column);
        void add(const vector<string>& row);
        bool empty();
        void print();
    };
}

#endif
