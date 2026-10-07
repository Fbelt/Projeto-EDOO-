#ifndef DISCIPLINE_H
#define DISCIPLINE_H

#include <string>
#include "Teacher.h"

using namespace std;

// Disciplina 
class Discipline {
private:
    string code;
    string name;
    int workload;       
    string syllabus;    
    Teacher* teacher;   
    bool hasFinalExam;  

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
