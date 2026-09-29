#ifndef FINALEXAMENROLLMENT_H
#define FINALEXAMENROLLMENT_H

#include "Enrollment.h"

using namespace std;

// Matrícula em disciplina com prova final. Herda de Enrollment
// e só troca a regra de situação (polimorfismo).
class FinalExamEnrollment : public Enrollment {
public:
    // Usa o construtor da classe base.
    FinalExamEnrollment(Student& student, ClassGroup& classGroup);

    // Regra com final: média >= 7 aprova, < 3 reprova, entre 3 e 7 vai para a final.
    string calculateStatus() const override;
};

#endif
