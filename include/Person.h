#ifndef PERSON_H
#define PERSON_H

#include <string>

using namespace std;

// Pessoa: classe base abstrata para Aluno e Professor
class Person {
private:
    string name;
    string birthday;
    string cpf;
    string contato;

public:
    Person(const string& n = "", const string& b = "", const string& c = "", const string& ct = "");
    virtual ~Person();

    string getName() const;
    string getBirthday() const;
    string getCpf() const;
    string getContato() const;

    void setName(const string& n);
    void setBirthday(const string& b);
    void setCpf(const string& c);
    void setContato(const string& ct);

    // Exibe os dados da pessoa — obrigatório implementar em Aluno e Professor
    virtual void exibirInfo() const = 0;
};

#endif
