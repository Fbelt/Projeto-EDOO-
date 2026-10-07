#ifndef PERSONCRUD_H
#define PERSONCRUD_H

#include <string>
#include <vector>
#include "Student.h"
#include "Teacher.h"

using namespace std;

// Cadastro de alunos e professores 
// Guarda ponteiros 
class PersonCRUD {
private:
    vector<Student*> alunos;
    vector<Teacher*> professores;

public:
    ~PersonCRUD(); 

    // Alunos
    void adicionarAluno(const string& nome, const string& nascimento,
                        const string& cpf, const string& matricula, const string& curso);
    Student* buscarAluno(const string& matricula);
    bool removerAluno(const string& matricula);
    void listarAlunos() const;
    vector<Student*>& getAlunos();

    // Professores
    void adicionarProfessor(const string& nome, const string& nascimento,
                            const string& cpf, const string& matricula);
    Teacher* buscarProfessor(const string& matricula);
    bool removerProfessor(const string& matricula);
    void listarProfessores() const;
    vector<Teacher*>& getProfessores();
};

#endif
