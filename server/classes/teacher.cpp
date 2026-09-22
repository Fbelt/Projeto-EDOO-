#include <iostream>
#include <vector>
#include "person.cpp"
#include "disciplines.cpp"

using namespace std;

class Teacher : public Person {
    private:
        string subject;
        string matriculationNumber;
        vector<Discipline> disciplines;
    public:
        Teacher (string n = "", string b = "", string c = "", string s = "", string mnumb = "") : Person(n, b, c) {
            subject = s;
            matriculationNumber = mnumb;
        };

        string getSubject() { return subject; }
        string getMatriculationNumber() { return matriculationNumber; }
        vector<Discipline> getDisciplines() { return disciplines; }

        void setSubject(string s) { subject = s; }
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
