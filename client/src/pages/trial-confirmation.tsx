
import React from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Check, Calendar, CreditCard } from "lucide-react";

export default function TrialConfirmation() {
  const [, setLocation] = useLocation();

  const trialExpiry = localStorage.getItem("trialExpiry");
  const expiryDate = trialExpiry ? new Date(trialExpiry).toLocaleDateString('pt-BR') : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm text-center">
          <CardHeader className="space-y-6">
            <div className="flex justify-center">
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-full">
                <Check className="w-12 h-12 text-white" />
              </div>
            </div>
            <div>
              <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                Teste ativado com sucesso! 🎉
              </CardTitle>
              <CardDescription className="text-lg text-gray-600">
                Seu período de teste gratuito de 7 dias começou agora
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-6 rounded-xl">
                <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Período do teste</h3>
                <p className="text-sm text-gray-600">
                  Seu teste expira em <strong>{expiryDate}</strong>
                </p>
              </div>

              <div className="bg-green-50 p-6 rounded-xl">
                <CreditCard className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Pagamento confirmado</h3>
                <p className="text-sm text-gray-600">
                  R$ 0,01 cobrado para validação
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-4">Durante o teste você terá acesso a:</h3>
              <div className="grid md:grid-cols-2 gap-3 text-left">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Dashboard completo</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Integração com APIs</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Relatórios avançados</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Suporte por email</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => setLocation("/dashboard")}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg py-3"
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                Acessar Dashboard
              </Button>

              <p className="text-sm text-gray-600">
                Lembre-se: após 7 dias você precisará escolher um plano para continuar usando o MarketingHub Pro
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-gray-600">
          <p>
            Dúvidas? Entre em contato conosco pelo{" "}
            <a href="mailto:suporte@marketinghubpro.com" className="text-blue-600 hover:underline">
              suporte@marketinghubpro.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
