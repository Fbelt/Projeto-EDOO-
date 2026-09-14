#include <iostream>
#include "person.cpp"

using namespace std;

class Student : public Person {
    private:
        string grade;
    public:
        Student (string g = "") {
            grade = g;
        };
        void displayInfo() {
            Person::displayInfo();
            cout << "Grade: " << grade << endl;
        };
};

int main() {
    Student student("A");
    student.displayInfo();
    return 0;
}