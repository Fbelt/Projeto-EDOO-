#include <iostream>
#include "person.cpp"

using namespace std;

class Teacher : public Person {
    private:
        string subject;
    public:
        Teacher (string s = "") {
            subject = s;
        };
        void displayInfo() {
            Person::displayInfo();
            cout << "Subject: " << subject << endl;
        }
};
       