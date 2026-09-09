#include <iostream>

using namespace std;

class Student {
    private:
        string name;
        int age;
        string grade;
    public:
        Student(string n, int a, string g) : name(n), age(a), grade(g) {}
        void displayInfo() {
            cout << "Name: " << name << endl;
            cout << "Age: " << age << endl;
            cout << "Grade: " << grade << endl;
        }
}