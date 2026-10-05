#ifndef DATABASE_H
#define DATABASE_H

#include <string>
#include <vector>
#include "sqlite3.h"

using namespace std;

// Conexão com o banco de dados (padrão Singleton):
// só existe um Database no programa todo.
// Para usar: Database::getInstance()
class Database {
private:
    sqlite3* db;

    // Construtor privado: ninguém de fora consegue criar outro Database
    Database();

public:
    static Database& getInstance();

    bool open(string path);
    void close();
    void createTables();

    // Roda um comando que não devolve nada (INSERT, UPDATE, DELETE...)
    void execute(string sql);

    // Roda um SELECT e devolve as linhas.
    // Cada linha é um vector com o valor de cada coluna, em texto.
    vector<vector<string>> query(string sql);
};

#endif
