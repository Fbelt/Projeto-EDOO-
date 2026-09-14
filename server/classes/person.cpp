#include <iostream>

using namespace std;

class Person {
    private:
        string name;
        int age;
        string cpf;
    public:
        Person(string n = "", int a = 0, string c = "") {
            name = n;
            age = a;
            cpf = c;
        }
        void displayInfo() {
            cout << "Name: " << name << endl;
            cout << "Age: " << age << endl;
            cout << "CPF: " << cpf << endl;
        }
};