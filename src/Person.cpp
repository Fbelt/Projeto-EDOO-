#include <iostream>
#include "Person.h"

using namespace std;

Person::Person(const string& n, const string& b, const string& c, const string& ct) {
    name = n;
    birthday = b;
    cpf = c;
    contato = ct;
}

string Person::getName() const { return name; }
string Person::getBirthday() const { return birthday; }
string Person::getCpf() const { return cpf; }
string Person::getContato() const { return contato; }

void Person::setName(const string& n) { name = n; }
void Person::setBirthday(const string& b) { birthday = b; }
void Person::setCpf(const string& c) { cpf = c; }
void Person::setContato(const string& ct) { contato = ct; }
