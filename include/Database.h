#ifndef DATABASE_H
#define DATABASE_H

#include <string>
#include <vector>
#include "sqlite3.h"

using namespace std;

class Database {
private:
    sqlite3* db;

    Database();

public:
    static Database& getInstance();

    bool open(string path);
    void close();
    void createTables();


    void execute(string sql);

    vector<vector<string>> query(string sql);

    // Prepara um texto para ir dentro de '...' no SQL (troca ' por '')
    static string escape(string s);
};

#endif
