#ifndef ENROLLMENT_H
#define ENROLLMENT_H

#include <string>
#include <vector>
#include "Student.h"

using namespace std;

// Matrícula: guarda as notas e a frequência de um aluno em uma turma
class Enrollment {
private:
    Student* student;
    vector<double> grades;  
    int classes;            
    int presences;       
    double finalGrade;    

public:
    Enrollment(Student& s);
    virtual ~Enrollment() {}  

    Student* getStudent();
    vector<double> getGrades();
    int getClasses();
    int getPresences();
    double getFinalGrade();

    void addGrade(double g);
    void setGrade(int i, double g);
    void addAttendance(bool present);
    void setFinalGrade(double g);

    double calculateAverage();
    double calculateAttendance();

    // "virtual": a matrícula com prova final troca essa regra
    virtual string calculateStatus();
};

#endif
