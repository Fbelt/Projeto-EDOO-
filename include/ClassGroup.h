#ifndef CLASSGROUP_H
#define CLASSGROUP_H

#include <string>
#include <vector>
#include "Discipline.h"
#include "Enrollment.h"
#include "Student.h"
#include "Teacher.h"

using namespace std;

// Turma: uma disciplina oferecida em um semestre
class ClassGroup {
private:
    string code;             
    Discipline* discipline;
    Teacher* teacher;
    string semester;        
    string schedule;        
    int capacity;            
    bool finished;           
    vector<Enrollment*> enrollments;  

public:
    ClassGroup(string c, Discipline* d, Teacher* t, string sem, string sch, int cap);
    ~ClassGroup();  // destrutor: apaga as matrículas

    string getCode();
    Discipline* getDiscipline();
    Teacher* getTeacher();
    string getSemester();
    string getSchedule();
    int getCapacity();
    bool isFinished();
    vector<Enrollment*> getEnrollments();

    void finish();
    bool enroll(Student& s);
    bool unenroll(Student& s);
    Enrollment* findEnrollment(Student& s);
    string getStatus(Enrollment* e);
    void printReport();
};

// Mostra todas as disciplinas que o aluno cursou
void printTranscript(Student& s, vector<ClassGroup*> groups);

#endif
