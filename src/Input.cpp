#include <iostream>
#include <cstdlib>
#include "Input.h"
#include "Ui.h"

using namespace std;

// Lê uma linha do teclado e tira os espaços do começo e do fim.
// Se a entrada acabar (Ctrl+D / Ctrl+Z), fecha o programa.
string readLine() {
    string line;
    if (!getline(cin, line)) {
        cout << endl;
        exit(0);
    }
    int start = 0;
    int end = line.size() - 1;
    while (start <= end && line[start] == ' ') start++;
    while (end >= start && line[end] == ' ') end--;
    return line.substr(start, end - start + 1);
}

// Diz se o texto só tem dígitos (0 a 9)
bool isDigits(string s) {
    if (s == "") return false;
    for (char c : s) {
        if (c < '0' || c > '9') return false;
    }
    return true;
}

// Lê a opção do menu
string readOption() {
    ui::prompt("Escolha uma opção");
    return readLine();
}

// Lê um texto obrigatório
string readText(string label) {
    while (true) {
        ui::prompt(label);
        string s = readLine();
        if (s == "") {
            ui::error("Este campo é obrigatório.", "Digite alguma coisa e pressione ENTER.");
        } else if (s.find('\'') != string::npos) {
            ui::error("Não use apóstrofo (').", "Ele atrapalha o banco de dados. Ex: escreva DAvila.");
        } else {
            return s;
        }
    }
}

// Lê um texto para edição: vazio = mantém o atual
string readTextOrKeep(string label, string current) {
    while (true) {
        ui::prompt(label + ui::muted(" [" + current + "]"));
        string s = readLine();
        if (s == "") {
            return current;
        }
        if (s.find('\'') != string::npos) {
            ui::error("Não use apóstrofo (').", "Ele atrapalha o banco de dados.");
        } else {
            return s;
        }
    }
}

// Lê um número inteiro dentro do intervalo
int readInt(string label, int min, int max) {
    while (true) {
        ui::prompt(label);
        string s = readLine();
        if (!isDigits(s) || s.size() > 9) {
            ui::error("Digite só números.", "Exemplo: " + to_string(min));
            continue;
        }
        int value = stoi(s);   // stoi transforma texto em número
        if (value < min || value > max) {
            ui::error("Número fora do intervalo.",
                      "Escolha um valor de " + to_string(min) + " a " + to_string(max) + ".");
            continue;
        }
        return value;
    }
}

// Converte o texto em nota. Devolve -1 se não for uma nota válida
double parseGrade(string s) {
    // aceita vírgula ou ponto: "8,5" vira "8.5"
    for (char& c : s) {
        if (c == ',') c = '.';
    }
    int dots = 0;
    for (char c : s) {
        if (c == '.') dots++;
        else if (c < '0' || c > '9') return -1;
    }
    if (s == "" || s == "." || dots > 1) return -1;

    double value = stod(s);   // stod transforma texto em número decimal
    if (value < 0 || value > 10) return -1;
    return value;
}

// Lê uma nota de 0 a 10
double readGrade(string label) {
    while (true) {
        ui::prompt(label);
        double value = parseGrade(readLine());
        if (value != -1) return value;
        ui::error("Nota inválida.", "Digite um número de 0 a 10. Exemplo: 7,5");
    }
}

// Lê uma nota de 0 a 10, ou ENTER para pular
double readGradeOrSkip(string label) {
    while (true) {
        ui::prompt(label + ui::muted(" (ENTER pula)"));
        string s = readLine();
        if (s == "") return -1;
        double value = parseGrade(s);
        if (value != -1) return value;
        ui::error("Nota inválida.", "Digite um número de 0 a 10, ou ENTER para pular este aluno.");
    }
}

// Lê sim ou não
bool readYesNo(string label) {
    while (true) {
        ui::prompt(label + ui::muted(" (s/n)"));
        string s = readLine();
        if (s == "s" || s == "S") return true;
        if (s == "n" || s == "N") return false;
        ui::error("Responda com s (sim) ou n (não).");
    }
}

// Lê a presença na chamada
bool readPresence(string label) {
    while (true) {
        ui::prompt(label + ui::muted(" (ENTER = presente, f = falta)"));
        string s = readLine();
        if (s == "" || s == "p" || s == "P") return true;
        if (s == "f" || s == "F") return false;
        ui::error("Use ENTER para presente ou f para falta.");
    }
}

// Lê um CPF: aceita com ou sem pontos e traço, mas precisa ter 11 dígitos
string readCpf(string label) {
    while (true) {
        ui::prompt(label + ui::muted(" (000.000.000-00)"));
        string s = readLine();
        string digits = "";
        for (char c : s) {
            if (c >= '0' && c <= '9') digits += c;
            else if (c != '.' && c != '-') digits = "x";   // letra ou símbolo: inválido
        }
        if (digits.size() == 11 && isDigits(digits)) {
            return digits.substr(0, 3) + "." + digits.substr(3, 3) + "." +
                   digits.substr(6, 3) + "-" + digits.substr(9, 2);
        }
        ui::error("CPF inválido.", "Precisa ter 11 números. Exemplo: 123.456.789-00");
    }
}

// Lê uma data DD/MM/AAAA e devolve AAAA-MM-DD (formato usado no banco)
string readDate(string label) {
    while (true) {
        ui::prompt(label + ui::muted(" (DD/MM/AAAA)"));
        string s = readLine();
        if (s.size() == 10 && s[2] == '/' && s[5] == '/') {
            string day = s.substr(0, 2);
            string month = s.substr(3, 2);
            string year = s.substr(6, 4);
            if (isDigits(day) && isDigits(month) && isDigits(year)) {
                int d = stoi(day), m = stoi(month), y = stoi(year);
                if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && y <= 2026) {
                    return year + "-" + month + "-" + day;
                }
            }
        }
        ui::error("Data inválida.", "Use dia/mês/ano com barras. Exemplo: 15/03/2005");
    }
}

// Mostra o aviso e pergunta se pode continuar
bool confirm(string message) {
    ui::warning(message);
    return readYesNo("Tem certeza");
}
