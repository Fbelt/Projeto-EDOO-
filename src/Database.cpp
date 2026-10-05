#include <iostream>
#include "Database.h"

using namespace std;

// Construtor: começa sem conexão
Database::Database() {
    db = nullptr;
}

// Singleton: o "static" faz o objeto ser criado só na primeira chamada
// e depois sempre devolve esse mesmo objeto
Database& Database::getInstance() {
    static Database instance;
    return instance;
}

// Abre o arquivo do banco (se não existir, o SQLite cria)
bool Database::open(string path) {
    if (sqlite3_open(path.c_str(), &db) != SQLITE_OK) {
        cout << "Erro ao abrir o banco" << endl;
        return false;
    }
    return true;
}

// Fecha a conexão
void Database::close() {
    sqlite3_close(db);
}

// Roda um comando que não devolve nada
void Database::execute(string sql) {
    char* error = nullptr;
    sqlite3_exec(db, sql.c_str(), nullptr, nullptr, &error);
    if (error != nullptr) {
        cout << "Erro no SQL: " << error << endl;
        sqlite3_free(error);
    }
}

// Roda um SELECT e guarda o resultado num vector de linhas
vector<vector<string>> Database::query(string sql) {
    vector<vector<string>> rows;

    sqlite3_stmt* stmt;
    sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr);

    // sqlite3_step anda uma linha por vez no resultado
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        vector<string> row;
        for (int i = 0; i < sqlite3_column_count(stmt); i++) {
            const char* value = (const char*) sqlite3_column_text(stmt, i);
            if (value == nullptr) {
                row.push_back("");  // coluna vazia
            } else {
                row.push_back(value);
            }
        }
        rows.push_back(row);
    }

    sqlite3_finalize(stmt);
    return rows;
}

// Cria as tabelas, se ainda não existirem
void Database::createTables() {
    // Alunos e professores ficam na mesma tabela (os dois são Pessoa).
    // "tipo" diz se é 'aluno' ou 'professor'. Professor fica com curso vazio.
    execute("CREATE TABLE IF NOT EXISTS pessoas ("
            "matricula TEXT PRIMARY KEY, tipo TEXT, nome TEXT, cpf TEXT,"
            "nascimento TEXT, contato TEXT, curso TEXT);");

    // tem_final: 1 = tem prova final, 0 = não tem
    execute("CREATE TABLE IF NOT EXISTS disciplinas ("
            "codigo TEXT PRIMARY KEY, nome TEXT, carga_horaria INTEGER,"
            "ementa TEXT, tem_final INTEGER, professor TEXT);");

    // encerrada: 1 = semestre acabou, 0 = ainda não
    execute("CREATE TABLE IF NOT EXISTS turmas ("
            "codigo TEXT PRIMARY KEY, disciplina TEXT, professor TEXT,"
            "semestre TEXT, horario TEXT, vagas INTEGER, encerrada INTEGER);");

    // Uma matrícula = um aluno numa turma. nota_final = -1 se não fez a final
    execute("CREATE TABLE IF NOT EXISTS matriculas ("
            "aluno TEXT, turma TEXT, nota_final REAL);");

    // Uma linha para cada nota do aluno na turma
    execute("CREATE TABLE IF NOT EXISTS notas ("
            "aluno TEXT, turma TEXT, valor REAL);");

    // Quantas aulas a turma teve e em quantas o aluno estava presente
    execute("CREATE TABLE IF NOT EXISTS frequencia ("
            "aluno TEXT, turma TEXT, aulas INTEGER, presencas INTEGER);");
}
