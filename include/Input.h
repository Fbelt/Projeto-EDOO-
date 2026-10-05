#ifndef INPUT_H
#define INPUT_H

#include <string>

using namespace std;

// Validação de entrada: cada função só devolve o valor quando ele é válido.
// Se o usuário digitar algo errado, mostra o erro e pergunta de novo.

// Lê a escolha de um menu (ex: "1", "2", "0", "?")
string readOption();

// Texto obrigatório. Não aceita vazio nem apóstrofo (o ' quebra o SQL)
string readText(string label);

// Texto para edição: ENTER vazio mantém o valor atual
string readTextOrKeep(string label, string current);

// Número inteiro entre min e max
int readInt(string label, int min, int max);

// Nota de 0 a 10 (aceita vírgula: "8,5")
double readGrade(string label);

// Nota de 0 a 10 ou ENTER para pular (devolve -1 quando pula)
double readGradeOrSkip(string label);

// Pergunta de sim ou não (s/n)
bool readYesNo(string label);

// Presença na chamada: ENTER ou "p" = presente, "f" = falta
bool readPresence(string label);

// CPF com 11 dígitos. Devolve formatado: 000.000.000-00
string readCpf(string label);

// Data no formato DD/MM/AAAA. Devolve no formato do banco: AAAA-MM-DD
string readDate(string label);

// Pede confirmação antes de uma ação que não dá para desfazer
bool confirm(string message);

#endif
