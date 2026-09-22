#include <iostream>

using namespace std;

class Discipline {
    private:
        string name;
        string code;
    public:
        Discipline(string n = "", string c = "") {
            name = n;
            code = c;
        }

        string getName() { return name; }
        string getCode() { return code; }

        void setName(string n) { name = n; }
        void setCode(string c) { code = c; }
        
};
