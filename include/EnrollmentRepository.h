#ifndef ENROLLMENTREPOSITORY_H
#define ENROLLMENTREPOSITORY_H

#include <vector>
#include "ClassGroup.h"
#include "Enrollment.h"
#include "Student.h"

using namespace std;

// Salva e carrega as matrículas
class EnrollmentRepository {
public:
    // Salva a matrícula do aluno na turma 
    void save(ClassGroup& group, Enrollment& e);
    void saveAll(ClassGroup& group);
    void remove(ClassGroup& group, Student& s);
    void loadInto(ClassGroup& group, vector<Student*>& students);
};

#endif
