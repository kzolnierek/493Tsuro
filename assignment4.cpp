//
//  main.cpp
//  Assignment 4: Markov Decision Process
//
//  Created by Keleigh Zolnierek on 11/23/15.
//  Copyright © 2015 Keleigh Zolnierek. All rights reserved.
//
#include <map>
#include <cstdlib>
#include <cmath>
#include <vector>
#include <iostream>
#include <iomanip>  //setw
#include <sstream>
#include <stdlib.h>     /* srand, rand */
#include <fstream>
using namespace std;

enum Directions {UP, DOWN, RIGHT, LEFT};

double calculateTotals(int curRow, int curCol, Directions facingDir, vector<vector<double>> &utilities){
    double total = 0.0;
    double pointOne = .1, pointEight = .8;
    double up = utilities[curRow][curCol], right = utilities[curRow][curCol],
    down = utilities[curRow][curCol], left = utilities[curRow][curCol];
    //check to see which directions are in scope
    if(curRow - 1 >= 0 && utilities[curRow - 1][curCol] <= 1)
        up = utilities[curRow - 1][curCol];
    if(curCol + 1 < 4 && utilities[curRow][curCol + 1] <= 1)
        right = utilities[curRow][curCol + 1];
    if(curRow + 1 < 3 && utilities[curRow + 1][curCol] <= 1)
        down =  utilities[curRow + 1][curCol];
    if(curCol - 1 >=  0 && utilities[curRow][curCol - 1] <= 1)
        left = utilities[curRow][curCol - 1];
    switch (facingDir){
        case UP:
            //left + up + right
            total =  pointOne * left + pointEight * up + pointOne * right;
            break;
        case DOWN:
            total =  pointOne * right + pointEight * down + pointOne * left;
            break;
        case RIGHT:
            total =  pointOne * up + pointEight * right + pointOne * down;
            break;
        case LEFT:
            total =  pointOne * down + pointEight * left + pointOne * up;
            break;
    }
    return total;
}

//uses value iteration to fill in the utilities matrix
void valueIteration(vector<vector<double>> &values, vector<vector<double>> &utilities,
                    vector<vector<double>> &utilitiesPrime, vector<double>& probs,
                    double discountFactor, bool (*fun)(int, int)){
    double maxChange = 0.0;
    do{
        maxChange = 0.0;
        for(auto row = utilities.begin(); row != utilities.end(); row++){
            for(auto col = row -> rbegin(); col != row -> rend(); col++){
                int r = (int)(row - utilities.begin()), c = (int)(col - row -> rbegin());
                //check so you dont start overwritting the 100, 1 and -1
                if(fun(r, c)){
                    // up, right, down, left;
                    double utilitiesCalculated[4];
                    //if youre facing up
                    utilitiesCalculated[0] = calculateTotals(r, c, UP, utilities);
                    //if youre facing right
                    utilitiesCalculated[1] = calculateTotals(r, c, RIGHT, utilities);
                    //if youre facing down
                    utilitiesCalculated[2] = calculateTotals(r, c, DOWN, utilities);
                    //if your facing left
                    utilitiesCalculated[3] = calculateTotals(r, c, LEFT, utilities);
                    //then choose the biggest and set
                    for(int i = 1; i < 4; i++){
                        if (utilitiesCalculated[i] > utilitiesCalculated[0])
                            utilitiesCalculated[0] = utilitiesCalculated[i];
                    }
                    utilitiesPrime[r][c] =  discountFactor * utilitiesCalculated[0] + values[r][c];
                    if(abs(utilitiesPrime[r][c] - utilities[r][c]) > maxChange)
                        maxChange = abs(utilitiesPrime[r][c] - utilities[r][c]);
                }
            }
        }
        //set utilities = utilitiesPrime
        for(int r = 0; r < 3; r++){
            for(int c = 0; c < 4; c++){
                utilities[r][c] = utilitiesPrime[r][c];
            }
        }
    }while(maxChange > 0.0000001);
}

//this will fill in the policy array based on what is in the utilities array
void policyIteration(vector<double>& probs, vector<vector<double>> &utilities,
                     vector<vector<string>> &policy, bool (*fun)(int, int), double discountFactor){
    for(auto row = utilities.begin(); row != utilities.end(); row++){
        for(auto col = row-> begin(); col != row -> end(); col++){
            int r = (int)(row - utilities.begin()), c = (int)(col - row->begin());
            //check so you dont start overwritting the 100, 1 and -1
            if(fun(r, c)){
                double utilitiesCalculated[4];
                //if you want up
                utilitiesCalculated[0] = calculateTotals(r, c, UP, utilities);
                //if you want right
                utilitiesCalculated[1] = calculateTotals(r, c, RIGHT, utilities);
                //if you want down
                utilitiesCalculated[2] = calculateTotals(r, c, DOWN, utilities);
                //if you want left
                utilitiesCalculated[3] = calculateTotals(r, c, LEFT, utilities);
                int largest = 0;
                for(int i = 1; i < 4; i++){
                    if(utilitiesCalculated[i] > utilitiesCalculated[largest])
                        largest = i;
                }
                switch (largest){
                    case 0:
                        policy[r][c] = '^';
                        break;
                    case 1:
                        policy[r][c] = '>';
                        break;
                    case 2:
                        policy[r][c] = 'V';
                        break;
                    case 3:
                        policy[r][c] = '<';
                        break;
                }
            }
        }
    }
}


bool thirdConfines(int r, int c){
    return !(r == 0 && c == 2);
}


bool policiesAreDifferent(vector<vector<string>> &policy1, vector<vector<string>> &policy2){
    for(auto row = policy1.begin(); row != policy1.end(); row++){
        for(auto col = row ->begin(); col != row -> end(); col++){
            int r = (int)(row - policy1.begin()), c = (int)(col - row->begin());
            if(policy1[r][c] != policy2[r][c])
                return  true;
        }
    }
    return false;
}


void problemThree(vector<vector<string>> &policy, double discount){
    vector<double> probs;
    probs.push_back(.8); //fwd
    probs.push_back(.1); //right
    probs.push_back(.1); //left

    vector<double> f(3, -1.0); f[0] = 3.0; f[2] = 10.0;
    vector<double> s(3, -1.0);
    vector<double> t(3, -1.0);
    vector<vector<double>> seventeenPointOneFour;
    seventeenPointOneFour.push_back(f);
    seventeenPointOneFour.push_back(s);
    seventeenPointOneFour.push_back(t);
    
    vector<double> fi(3, 0.0); fi[2] = 10.0;
    vector<double> se(3, 0.0);
    vector<double> th(3, 0.0);
    vector<vector<double>> utilities;
    utilities.push_back(fi);
    utilities.push_back(se);
    utilities.push_back(th);
    
    vector<vector<double>> utilitiesPrime;
    utilitiesPrime.push_back(fi);
    utilitiesPrime.push_back(se);
    utilitiesPrime.push_back(th);

    vector<string> first(3, "0"); first[0] = "3"; first[2] = "10";
    vector<string> second(3, "0");
    vector<string> third(3, "0");
    policy.push_back(first);
    policy.push_back(second);
    policy.push_back(third);

    bool (*fun)(int, int);
    fun = &thirdConfines;
    valueIteration(seventeenPointOneFour, utilities, utilitiesPrime, probs, discount, fun);
    policyIteration(probs, utilities, policy, fun, discount);

}

void findThresholdThree(double left_boundary, double right_boundary, int thresholdsFound, vector<double> &thresholds) {
    
    vector<vector<string>> leftvec;
    problemThree(leftvec, left_boundary);
    vector<vector<string>> rightvec;
    problemThree(rightvec, right_boundary);
    
    if (thresholdsFound == 5)
        return;    // base case 1
    if (!policiesAreDifferent(leftvec, rightvec))
        return;  // base case 2
    if (right_boundary - left_boundary < 0.0001) {   // base case 3
        // One threshold found.
        ++thresholdsFound;
        thresholds.push_back(left_boundary); //append threshold value (left_boundary) to the list of thresholds;
        cout << "optimal: " << left_boundary << endl;
        // printVectorChar(leftvec); //append optimal utilities at that threshold to the list of optimal utilities;
        return;
    }
    findThresholdThree(left_boundary, (left_boundary + right_boundary)/2.0, thresholdsFound, thresholds);    // recursive call 1
    findThresholdThree((left_boundary + right_boundary)/2.0, right_boundary, thresholdsFound, thresholds);  // recursive call 2
}


int main(int argc, const char * argv[]) {

    vector<double> thresh3;
    findThresholdThree(0, 1 - .0001, 0, thresh3);
    return 0;
}
