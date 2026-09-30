#ifndef FINALEXAMENROLLMENT_H
#define FINALEXAMENROLLMENT_H

#include "Enrollment.h"

using namespace std;

// Matrícula com prova final: herda tudo de Enrollment
// e só muda a regra de aprovação
class FinalExamEnrollment : public Enrollment {
public:
    FinalExamEnrollment(Student& s);
    string calculateStatus() override;
};

#endif
