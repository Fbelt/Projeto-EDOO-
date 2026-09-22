#include <iostream>

using namespace std;

class Person {
    private:
        string name;
        string birthday;
        string cpf;
    public:
        Person(string n = "", string b = "", string c = "") {
            name = n;
            birthday = b;
            cpf = c;
        }

        string getName() { return name; }
        string getBirthday() { return birthday; }
        string getCpf() { return cpf; }

        void setName(string n) { name = n; }
        void setBirthday(string b) { birthday = b; }
        void setCpf(string c) { cpf = c; }
      
};
