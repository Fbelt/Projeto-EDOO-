#include "Database.h"
#include "Seed.h"
#include "SchoolData.h"
#include "Menus.h"
#include "Ui.h"

using namespace std;

// Começo do programa: abre o banco, carrega os dados e abre o menu
int main() {
    ui::setup();
    ui::splash();

    // Banco de dados (Singleton: sempre a mesma conexão)
    Database& db = Database::getInstance();
    if (!db.open("data/escola.db")) {
        ui::error("Não foi possível abrir data/escola.db.", "Rode o programa de dentro da pasta do projeto.");
        return 1;
    }
    ui::step("Banco de dados SQLite conectado");
    db.createTables();
    seedDatabase();   // só coloca dados de exemplo se o banco estiver vazio
    ui::step("Tabelas prontas");

    // Carrega tudo do banco para a memória
    SchoolData data;
    loadData(data);
    ui::step(to_string(data.students.size()) + " alunos, " + to_string(data.teachers.size()) + " professores e " +
             to_string(data.groups.size()) + " turmas carregados");
    ui::pause();

    mainMenu(data);

    // Fim: libera a memória e fecha o banco
    freeData(data);
    db.close();
    ui::goodbye();
    return 0;
}
