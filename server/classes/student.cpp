#include <iostream>
#include <vector>
#include "person.cpp"
#include "disciplines.cpp"

using namespace std;

class Student : public Person {
    private:
        string grade;
        string matriculationNumber;
        vector<Discipline> disciplines;
    public:
        Student (string n = "", string b = "", string c = "", string g = "", string mnumb = "") : Person(n, b, c) {
            grade = g;
            matriculationNumber = mnumb;
        };

        string getGrade() { return grade; }
        string getMatriculationNumber() { return matriculationNumber; }
        vector<Discipline> getDisciplines() { return disciplines; }

        void setGrade(string g) { grade = g; }
        void setMatriculationNumber(string mnumb) { matriculationNumber = mnumb; }

        void addDiscipline(Discipline d) {
            disciplines.push_back(d);
        };
        
        void removeDiscipline(string code) {
            for (int i = 0; i < disciplines.size(); i++) {
                if (disciplines[i].getCode() == code) {
                    disciplines.erase(disciplines.begin() + i);
                    return;
                }
            }
        };
};