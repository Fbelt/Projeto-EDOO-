#ifndef DISCIPLINE_H
#define DISCIPLINE_H

#include <string>
#include "Teacher.h"

using namespace std;

// Disciplina (ex: CIN0135 - EDOO)
class Discipline {
private:
    string code;
    string name;
    int workload;       // carga horária
    string syllabus;    // ementa
    Teacher* teacher;   // professor responsável
    bool hasFinalExam;  // true = tem prova final

public:
    Discipline(string c, string n, int w, string s, bool f);

    string getCode();
    string getName();
    int getWorkload();
    string getSyllabus();
    Teacher* getTeacher();
    bool getHasFinalExam();

    void setName(string n);
    void setWorkload(int w);
    void setSyllabus(string s);
    void setTeacher(Teacher* t);
};

#endif
